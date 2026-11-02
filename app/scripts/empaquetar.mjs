/**
 * Empaqueta el build en un único archivo HTML autocontenido.
 *
 * Sirve para mostrar la demo sin levantar ningún servidor: se abre con doble
 * clic o se manda por mail/WhatsApp.
 *
 * Un <script type="module" src="..."> se descarga por fetch, y desde file://
 * eso lo bloquea CORS (origin "null"). Un módulo escrito en línea no se
 * descarga, así que sí ejecuta.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const raiz = path.resolve(import.meta.dirname, '..')
const dist = path.join(raiz, 'dist')
const salida = path.resolve(raiz, '..', 'demo-agenda.html')

const assets = await readdir(path.join(dist, 'assets'))
const archivoJs = assets.find((f) => f.endsWith('.js'))
const archivoCss = assets.find((f) => f.endsWith('.css'))

if (!archivoJs || !archivoCss) {
  console.error('No se encontró el build. Ejecutá "npm run build" primero.')
  process.exit(1)
}

const js = await readFile(path.join(dist, 'assets', archivoJs), 'utf8')
const css = await readFile(path.join(dist, 'assets', archivoCss), 'utf8')
const html = await readFile(path.join(dist, 'index.html'), 'utf8')

// El favicon va incrustado: el HTML viaja solo, sin carpeta de assets al lado.
const favicon = await readFile(path.join(dist, 'tijera.svg'), 'utf8')
const faviconUri = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`

// Un "</script>" dentro de una cadena del bundle cerraría la etiqueta antes de
// tiempo; escaparlo no cambia lo que ejecuta el motor de JavaScript.
const jsSeguro = js.replace(/<\/script/gi, '<\\/script')

// Red de seguridad: si el navegador es viejo o algo falla al arrancar, se ve
// un mensaje claro en vez de una pantalla en blanco.
const guardia = `
    <script>
      window.addEventListener('error', function (e) {
        var r = document.getElementById('root')
        if (r && !r.childElementCount) {
          r.innerHTML =
            '<div style="font:16px/1.6 system-ui;max-width:34rem;margin:12vh auto;padding:0 1.5rem;color:#2A2320">' +
            '<h1 style="font:600 22px/1.3 Georgia,serif">No se pudo abrir la demo</h1>' +
            '<p>Probá con Chrome, Edge o Firefox actualizado.</p>' +
            '<p style="color:#6B5D53;font-size:13px">Detalle: ' + (e.message || e.type) + '</p></div>'
        }
      })
    </script>`

// Ojo: el reemplazo va como función. Si se pasara como cadena, las secuencias
// `$&`, "$'" y "$`" que aparecen dentro del bundle minificado se expandirían
// como patrones de String.replace y romperían el archivo.
const resultado = html
  .replace(/\s*<script type="module"[^>]*><\/script>/i, '')
  .replace(/\s*<link rel="stylesheet"[^>]*>/i, '')
  .replace(/href="\.\/tijera\.svg"/i, () => `href="${faviconUri}"`)
  .replace('</head>', () => `  <style>\n${css}\n  </style>\n  </head>`)
  .replace(
    '</body>',
    () => `${guardia}\n  <script type="module">\n${jsSeguro}\n  </script>\n</body>`,
  )

await writeFile(salida, resultado, 'utf8')

const kb = Math.round(Buffer.byteLength(resultado) / 1024)
console.log(`Demo autocontenida lista: ${salida} (${kb} KB)`)
console.log('Se abre con doble clic, sin instalar nada.')
