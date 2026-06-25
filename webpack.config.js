const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: './src/content.ts',
  output: {
    filename: 'content.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // No eval() — required for MV3 content security policy
  devtool: false,
};
