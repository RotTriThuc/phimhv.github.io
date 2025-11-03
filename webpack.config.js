/* Webpack Configuration - Advanced bundling and optimization */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WorkboxPlugin = require('workbox-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';
const isAnalyze = process.env.ANALYZE === 'true';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  
  entry: {
    // Main application bundle
    main: './app-modular.js',
    
    // Vendor libraries (will be split automatically)
    vendor: [
      './firebase-config.js'
    ],
    
    // Service worker (separate entry)
    'service-worker': './service-worker.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDevelopment 
      ? '[name].js' 
      : '[name].[contenthash:8].js',
    chunkFilename: isDevelopment 
      ? '[name].chunk.js' 
      : '[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
    
    // Modern module format
    module: true,
    environment: {
      arrowFunction: true,
      bigIntLiteral: true,
      const: true,
      destructuring: true,
      dynamicImport: true,
      forOf: true,
      module: true
    }
  },
  
  experiments: {
    outputModule: true
  },
  
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'modules'),
      '@types': path.resolve(__dirname, 'types'),
      '@components': path.resolve(__dirname, 'modules/component-library'),
      '@utils': path.resolve(__dirname, 'modules/utils')
    }
  },
  
  module: {
    rules: [
      // TypeScript/JavaScript
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
                  },
                  modules: false,
                  useBuiltIns: 'usage',
                  corejs: 3
                }],
                '@babel/preset-typescript'
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-optional-chaining',
                '@babel/plugin-proposal-nullish-coalescing-operator',
                ['@babel/plugin-transform-runtime', {
                  corejs: 3,
                  helpers: true,
                  regenerator: true,
                  useESModules: true
                }]
              ]
            }
          }
        ]
      },
      
      // CSS/SCSS
      {
        test: /\.(css|scss)$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: isDevelopment
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'autoprefixer',
                  'cssnano'
                ]
              }
            }
          },
          'sass-loader'
        ]
      },
      
      // Images
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      },
      
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]'
        }
      },
      
      // Web Workers
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: {
            filename: '[name].[contenthash:8].worker.js'
          }
        }
      }
    ]
  },
  
  plugins: [
    // HTML generation
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      inject: 'body',
      minify: !isDevelopment && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    
    // CSS extraction
    !isDevelopment && new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    }),
    
    // Service Worker generation
    !isDevelopment && new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      swDest: 'sw.js',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/phimapi\.com\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 5 * 60 // 5 minutes
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
            }
          }
        }
      ]
    }),
    
    // Bundle analyzer
    isAnalyze && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ].filter(Boolean),
  
  optimization: {
    minimize: !isDevelopment,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: !isDevelopment,
            drop_debugger: !isDevelopment
          },
          format: {
            comments: false
          }
        },
        extractComments: false
      }),
      new CssMinimizerPlugin()
    ],
    
    // Code splitting
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        
        // Common modules
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        },
        
        // Core modules
        core: {
          test: /[\\/]modules[\\/](logger|utils|api)\.js$/,
          name: 'core',
          priority: 8,
          reuseExistingChunk: true
        },
        
        // UI modules
        ui: {
          test: /[\\/]modules[\\/](ui-components|image-loader|component-library)\.js$/,
          name: 'ui',
          priority: 7,
          reuseExistingChunk: true
        },
        
        // Page modules
        pages: {
          test: /[\\/]modules[\\/](pages|router)\.js$/,
          name: 'pages',
          priority: 6,
          reuseExistingChunk: true
        },
        
        // Advanced features
        advanced: {
          test: /[\\/]modules[\\/](error-boundaries|performance-monitor|testing|bundle-optimizer)\.js$/,
          name: 'advanced',
          priority: 4,
          reuseExistingChunk: true
        }
      }
    },
    
    // Runtime chunk
    runtimeChunk: {
      name: 'runtime'
    },
    
    // Module IDs
    moduleIds: 'deterministic',
    chunkIds: 'deterministic'
  },
  
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    
    // Proxy API calls
    proxy: {
      '/api': {
        target: 'https://phimapi.com',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  
  // Performance hints
  performance: {
    hints: isDevelopment ? false : 'warning',
    maxEntrypointSize: 512000, // 500kb
    maxAssetSize: 512000 // 500kb
  },
  
  // Stats
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }
};
