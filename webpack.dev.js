const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

const VERSION = pkg.version;

module.exports = env => merge(common, {
  mode: 'development',
  devtool: 'source-map',
  output: {
    filename: `[name]${env.branch !== 'master' ? `-dev-${VERSION}` : `-${VERSION}`}.js`
  }
});
