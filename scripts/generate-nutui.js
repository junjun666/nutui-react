// generate nutui.react.ts file for dev or build
const config = require('../src/config.json')
const glob = require('glob')
const path = require('path')
const fs = require('fs-extra')

let importStr = ``
let importMarkdownStr = ``
let importOnlineEditScssStr = ``
let importScssStr = `\n`
const packages = []
const onlineEditScss = []
const mds = []
const raws = []

// 此js的文件的核心就是遍历../src/config.json这个文件，拿到其中的变量再通过glob进行文件路径模式匹配，进行变量的赋值。
// 然后再借助fs-extra这个包里面的outputFile功能，输出到对应的文件当中去。
config.nav.map((item) => {
  item.packages.forEach((element) => {
    let { name, show, exportEmpty, exclude } = element
    // 这里exclude构建去除掉Icon的构建
    if (exclude) return
    if (show || exportEmpty) {
      importStr += `import ${name} from '@/packages/${name.toLowerCase()}';\n`
      importScssStr += `import '@/packages/${name.toLowerCase()}/${name.toLowerCase()}.scss';\n`

      packages.push(name)
    }
    if (show) {
      glob
        .sync(
          path.join(__dirname, `../src/packages/${name.toLowerCase()}/`) +
            '*.md'
        )
        .map((f) => {
          let lang = 'zh-CN'
          // 这里匹配的是md的文件(doc开头，md结尾，中间是a-z的字符)
          // matched [
          // 'doc.zh-TW.md',
          // 'zh-TW',
          //  index: 77,
          //  minput: '/Users/liuyijun17/Desktop/nutui-react-v2.0/nutui-react/src/packages/uploader/doc.zh-TW.md',
          //  groups: undefined
          // ]
          let matched = f.match(/doc\.([a-z-]+)\.md/i)
          if (matched) {
            ;[, lang] = matched
            // lang: 'zh-TW'
            const langComponentName = `${name}${lang.replace('-', '')}`
            // langComponentName: UploaderzhTW
            importMarkdownStr += `import ${langComponentName} from '@/packages/${name.toLowerCase()}/doc.${lang}.md?raw';\n`
            raws.push(langComponentName)
          }
        })
      glob
        .sync(
          path.join(__dirname, `../src/packages/${name.toLowerCase()}/`) +
            'demo.scss'
        )
        .map((f) => {
          onlineEditScss.push(name)
          importOnlineEditScssStr += `import ${name}Scss from '@/packages/${name.toLowerCase()}/demo.scss?raw';\n`
        })
      importMarkdownStr += `import ${name} from '@/packages/${name.toLowerCase()}/doc.md?raw';\n`
      mds.push(name)
      raws.push(name)
    }
  })
})

// nutui.react.build.ts通过import和export的组合导出组件
let fileStrBuild = `${importStr}
export { ${packages.join(',')} };`

fs.outputFile(
  path.resolve(__dirname, '../src/packages/nutui.react.build.ts'),
  fileStrBuild,
  'utf8',
  (error) => {
    if (error) throw error
  }
)

// nutui.react.ts通过import和export的组合导出组件和组件的样式文件
let fileStr = `${importStr}
${importScssStr}
export { ${packages.join(',')} };`
fs.outputFile(
  path.resolve(__dirname, '../src/packages/nutui.react.ts'),
  fileStr,
  'utf8',
  (error) => {
    if (error) throw error
  }
)

// nutui.react.scss.ts通过import和export的组合导出组件的样式文件
fs.outputFile(
  path.resolve(__dirname, '../src/packages/nutui.react.scss.ts'),
  importScssStr,
  'utf8',
  (error) => {
    if (error) throw error
  }
)

// sites/doc/docs.ts导出了组件的demo样式
// sites/doc/docs.ts导出了组件的不同语言的doc文件
let mdFileStr = `${importMarkdownStr}
${importOnlineEditScssStr}
export const scssRaws = { ${onlineEditScss.map((r) => r + 'Scss').join(',')} }
export const routers = [${mds.map((m) => `'${m}'`)}]
export const raws = {${raws.join(',')}}
`

fs.outputFile(
  path.resolve(__dirname, '../src/sites/doc/docs.ts'),
  mdFileStr,
  'utf8',
  (error) => {
    if (error) throw error
  }
)
