// 这个js脚本就是提取styles/variables.scss和组件的scss文件中的主题css样式变量，然后转换输出到文件中
// 格式类似于下面的这种：
// export type NutCSSVariables =
// | 'nutuiBrandColor'
// | 'nutuiBrandColorStart'
// | 'nutuiBrandColorEnd'
// | 'nutuiBrandLinkColor'

const glob = require('glob')
const path = require('path')
const fse = require('fs-extra')
const prettier = require('prettier')
const projectID = process.env.VITE_APP_PROJECT_ID

const UPPERCASE = /[\p{Lu}]/u
const LOWERCASE = /[\p{Ll}]/u
const LEADING_CAPITAL = /^[\p{Lu}](?![\p{Lu}])/gu
const IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u
const SEPARATORS = /[_.\- ]+/

const LEADING_SEPARATORS = new RegExp('^' + SEPARATORS.source)
const SEPARATORS_AND_IDENTIFIER = new RegExp(
  SEPARATORS.source + IDENTIFIER.source,
  'gu'
)
const NUMBERS_AND_IDENTIFIER = new RegExp('\\d+' + IDENTIFIER.source, 'gu')

const preserveCamelCase = (
  string,
  toLowerCase,
  toUpperCase,
  preserveConsecutiveUppercase
) => {
  let isLastCharLower = false
  let isLastCharUpper = false
  let isLastLastCharUpper = false
  let isLastLastCharPreserved = false

  for (let index = 0; index < string.length; index++) {
    const character = string[index]
    isLastLastCharPreserved = index > 2 ? string[index - 3] === '-' : true

    if (isLastCharLower && UPPERCASE.test(character)) {
      string = string.slice(0, index) + '-' + string.slice(index)
      isLastCharLower = false
      isLastLastCharUpper = isLastCharUpper
      isLastCharUpper = true
      index++
    } else if (
      isLastCharUpper &&
      isLastLastCharUpper &&
      LOWERCASE.test(character) &&
      (!isLastLastCharPreserved || preserveConsecutiveUppercase)
    ) {
      string = string.slice(0, index - 1) + '-' + string.slice(index - 1)
      isLastLastCharUpper = isLastCharUpper
      isLastCharUpper = false
      isLastCharLower = true
    } else {
      isLastCharLower =
        toLowerCase(character) === character &&
        toUpperCase(character) !== character
      isLastLastCharUpper = isLastCharUpper
      isLastCharUpper =
        toUpperCase(character) === character &&
        toLowerCase(character) !== character
    }
  }

  return string
}

const preserveConsecutiveUppercase = (input, toLowerCase) => {
  LEADING_CAPITAL.lastIndex = 0

  return input.replace(LEADING_CAPITAL, (m1) => toLowerCase(m1))
}

const postProcess = (input, toUpperCase) => {
  SEPARATORS_AND_IDENTIFIER.lastIndex = 0
  NUMBERS_AND_IDENTIFIER.lastIndex = 0

  return input
    .replace(SEPARATORS_AND_IDENTIFIER, (_, identifier) =>
      toUpperCase(identifier)
    )
    .replace(NUMBERS_AND_IDENTIFIER, (m) => toUpperCase(m))
}

function camelCase(input, options) {
  if (!(typeof input === 'string' || Array.isArray(input))) {
    throw new TypeError('Expected the input to be `string | string[]`')
  }

  options = {
    pascalCase: false,
    preserveConsecutiveUppercase: false,
    ...options,
  }

  if (Array.isArray(input)) {
    input = input
      .map((x) => x.trim())
      .filter((x) => x.length)
      .join('-')
  } else {
    input = input.trim()
  }

  if (input.length === 0) {
    return ''
  }

  const toLowerCase =
    options.locale === false
      ? (string) => string.toLowerCase()
      : (string) => string.toLocaleLowerCase(options.locale)

  const toUpperCase =
    options.locale === false
      ? (string) => string.toUpperCase()
      : (string) => string.toLocaleUpperCase(options.locale)

  if (input.length === 1) {
    if (SEPARATORS.test(input)) {
      return ''
    }

    return options.pascalCase ? toUpperCase(input) : toLowerCase(input)
  }

  const hasUpperCase = input !== toLowerCase(input)

  if (hasUpperCase) {
    input = preserveCamelCase(
      input,
      toLowerCase,
      toUpperCase,
      options.preserveConsecutiveUppercase
    )
  }

  input = input.replace(LEADING_SEPARATORS, '')
  input = options.preserveConsecutiveUppercase
    ? preserveConsecutiveUppercase(input, toLowerCase)
    : toLowerCase(input)

  if (options.pascalCase) {
    input = toUpperCase(input.charAt(0)) + input.slice(1)
  }

  return postProcess(input, toUpperCase)
}

function generate() {
  const files = [
    !projectID
      ? './src/styles/variables.scss'
      : `./src/styles/variables-${projectID}.scss`,
    ...glob.sync('./src/packages/**/*.scss', {
      ignore: './src/**/demo.scss',
    }),
  ]
  console.log('files', files)
  Promise.all(
    // 里面的每一个项都是一个promise
    files.map(function (file) {
      return fse.readFile(path.join(process.cwd(), file)).then((data) => {
        if (!data) return []
        return matchCssVarFromText(data.toString())
      })
    })
  ).then((data) => {
    // 这里的data里面有很多的数组，有的数组项带值（比如toast匹配到就有值），有的是空数组，这个reduce的目的是想要将所有数组项拼接成一个大数组。
    const result = data.reduce((pre, curr) => {
      return [...pre, ...curr]
    }, [])

    // 这里的result就是一个合并后的大数组
    // 这里想通过new Set进行对数组项里面的值一个去重的效果
    const unique = Array.from(new Set(result))

    // 借助prettier这个npm包进行类型的格式化
    fse.writeFile(
      path.join(process.cwd(), './src/packages/configprovider/types.ts'),
      prettier.format(`export type NutCSSVariables = ${unique.join('|')}`, {
        trailingComma: 'es5', // 表示只在ES5兼容的环境下保留尾随逗号。
        tabWidth: 2,
        semi: false,
        singleQuote: true,
        printWidth: 80,
        endOfLine: 'auto', // 'auto'表示根据当前环境自动选择换行符类型（例如，Windows使用CRLF，Unix使用LF）。
        parser: 'babel',
      })
    )
  })
}

function matchCssVarFromText(text) {
  if (!text) return []
  const matched = text.match(/--nutui[\w\-]*/gi)
  if (!matched) return []
  // 目前会匹配到两个matched，一个是variables.scss里面的文件，另一个是toast.scss里面的文件
  // matched: 比如'--nutui-brand-color'，'--nutui-brand-color-start' 会匹配到
  const variables = matched.map((cssVar) => `'${camelCase(cssVar)}'`)
  // variables: ["'nutuiBrandColor'", "'nutuiBrandColorStart'"]
  return variables
}

generate()
