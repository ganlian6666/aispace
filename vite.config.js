import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // 源码目录
  root: 'src',

  // 构建输出配置
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      output: {
        // 简化文件名，便于 SSR 引用
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  },

  // CSS 预处理器配置
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        // Ant Design 主题变量覆盖 - 柔和浅色系
        modifyVars: {
          '@primary-color': '#5b8def',
          '@border-radius-base': '8px',
          '@body-background': '#f5f7fa',
          '@component-background': '#ffffff',
          '@text-color': '#333333',
          '@text-color-secondary': '#666666',
          '@border-color-base': '#e8e8e8'
        }
      }
    }
  },

  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles')
    }
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    // Cloudflare Functions API 代理
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true
      }
    }
  }
});
