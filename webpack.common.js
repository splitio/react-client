const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    'splitio-react': ['./umd.ts']
  },

  output: {
    path: path.resolve(__dirname, 'lib-umd'),
    filename: '[name].js',
    library: 'splitio',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },

  mode: 'production',

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  }
};
