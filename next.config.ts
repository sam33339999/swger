import type { NextConfig } from "next";
// Import the mini-css-extract-plugin
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { dev, isServer }) => {
    // Only run in the client build (not server build) and in production mode
    if (!isServer && !dev) {
      // Add the MiniCssExtractPlugin to the webpack config
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: 'static/css/[contenthash].css',
          chunkFilename: 'static/css/[contenthash].css',
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
