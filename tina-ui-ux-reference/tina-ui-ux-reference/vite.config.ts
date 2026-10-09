import { fileURLToPath, URL } from 'node:url'
import { createReadStream, stat } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const modelDirectory = resolve(fileURLToPath(new URL('../../tina-onnx-model/', import.meta.url)))

function serveLocalTinaModel(): Plugin {
  return {
    name: 'serve-local-tina-model',
    configureServer(server) {
      server.middlewares.use('/tina-onnx-model', (request, response, next) => {
        let requestedPath
        try {
          requestedPath = decodeURIComponent((request.url ?? '/').split('?')[0])
        } catch (error) {
          next(error)
          return
        }

        const filePath = resolve(modelDirectory, `.${requestedPath}`)
        if (filePath !== modelDirectory && !filePath.startsWith(`${modelDirectory}${sep}`)) {
          response.statusCode = 403
          response.end('Forbidden')
          return
        }

        stat(filePath, (error, file) => {
          if (error) {
            if (error.code === 'ENOENT') {
              response.statusCode = 404
              response.end('Tina model asset not found')
            }
            else next(error)
            return
          }
          if (!file.isFile()) {
            next()
            return
          }

          const contentType = extname(filePath) === '.json'
            ? 'application/json'
            : extname(filePath) === '.txt'
              ? 'text/plain; charset=utf-8'
              : 'application/octet-stream'
          response.setHeader('Content-Type', contentType)
          response.setHeader('Content-Length', file.size)
          createReadStream(filePath).on('error', next).pipe(response)
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), serveLocalTinaModel()],
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
