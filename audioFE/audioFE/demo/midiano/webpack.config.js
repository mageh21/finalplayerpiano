const path = require('path');

module.exports = {
  entry: './js/main.js', // Entry point of your application
  output: {
    filename: 'bundle.js', // Name of the output bundle
    path: path.resolve(__dirname, 'dist'), // Output directory
    clean: true, // Clean the output directory before each build
  },
  mode: 'production', // Enable production optimizations (like minification)
  devtool: 'source-map', // Generate source maps for easier debugging
  // Add module rules for loaders (e.g., CSS, images) here later if needed
  module: {
    rules: [
      // Add CSS Loader rule
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'], // Injects CSS into the DOM via <style> tags
      },
      // Add other loaders here if needed (e.g., for images, fonts)
    ],
  },
  // Add plugins here later if needed
  // plugins: [],
}; 