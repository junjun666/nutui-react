// 1) 生成dist目录下packages的文件夹，里面是每个组件的scss样式
// 2) 把src下的styles目录拷贝到dist的styles目录下
// 3) 生成一个文件夹：dist/styles/themes/default.scss，里面引入了各个组件的样式
const config = require('../src/config.json')
const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')

let fileStr = `@import '../theme-default.scss';\n@import '../variables.scss';\n`
const projectID = process.env.VITE_APP_PROJECT_ID
if (projectID) {
  fileStr = `@import '../theme-default.scss';\n@import '../variables-${projectID}.scss';\n`
}
let tasks = []
const componentsScss = glob.sync('./src/packages/**/*.scss')
componentsScss.map((cs) => {
  if (cs.indexOf('demo.scss') > -1) return
  tasks.push(
    fs
      .copy(
        path.resolve(__dirname, `.${cs}`),
        path.resolve(__dirname, `../dist`, `${cs.replace('./src/', '')}`)
      )
      .catch((error) => {})
  )
})

config.nav.map((item) => {
  item.packages.forEach((element) => {
    if (element.exclude) return
    let folderName = element.name.toLowerCase()
    fileStr += `@import '../../packages/${folderName}/${folderName}.scss';\n`
  })
})

tasks.push(
  fs.copy(
    path.resolve(__dirname, '../src/styles'),
    path.resolve(__dirname, '../dist/styles')
  )
)

Promise.all(tasks).then((res) => {
  fs.outputFile(
    path.resolve(__dirname, '../dist/styles/themes/default.scss'),
    fileStr,
    'utf8',
    (error) => {
      // logger.success(`文件写入成功`);
    }
  )
})
