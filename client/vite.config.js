import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite' // 1. Import the Tailwind plugin
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(), // 2. Add Tailwind here (NOT inside babel)
    react(),
    babel({
      presets: [reactCompilerPreset()], // Keep this strictly for the React Compiler
    })
  ],
  resolve: {
    alias: {
      // 3. Force your extension and apps to share a single React instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    }
  }
})