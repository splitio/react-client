const path = require('path');

module.exports = {
  entry: {
    'splitio-react': ['./umd.ts']
  },

  output: {
    path: path.resolve(__dirname, 'umd'),
    filename: '[name].js',
    library: 'splitio',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },

  mode: 'production',
  devtool: false, // Remove source mapping. 'eval' is used by default in Webpack 5

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  node: false, // Not include Node.js polyfills, https://webpack.js.org/configuration/node
  target: ['web', 'es5'], // target 'es5', since 'es2015' is the default in Webpack 5

  externals: {
    react: 'React'
  }
};
