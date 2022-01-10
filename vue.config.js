
const WorkerPlugin = require('worker-plugin')

module.exports = {  
  configureWebpack: {
    plugins: [new WorkerPlugin()]
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      // List native deps here if they don't work
      externals: ['node-xlsx'],
      // If you are using Yarn Workspaces, you may have multiple node_modules folders
      // List them all here so that VCP Electron Builder can find them
      nodeModulesPath: ['../../node_modules', './node_modules']
    }
  }
}