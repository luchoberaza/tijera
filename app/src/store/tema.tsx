import * as React from 'react'

type Tema = 'claro' | 'oscuro'

const CLAVE = 'tijera:tema'

const Ctx = React.createContext<{ tema: Tema; alternar: () => void } | null>(null)

function temaInicial(): Tema {
  if (typeof window === 'undefined') return 'claro'
  const guardado = window.localStorage.getItem(CLAVE) as Tema | null
  if (guardado === 'claro' || guardado === 'oscuro') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = React.useState<Tema>(temaInicial)

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro')
    document.documentElement.style.colorScheme = tema === 'oscuro' ? 'dark' : 'light'
    try {
      window.localStorage.setItem(CLAVE, tema)
    } catch {
      /* noop */
    }
  }, [tema])

  const valor = React.useMemo(
    () => ({ tema, alternar: () => setTema((t) => (t === 'claro' ? 'oscuro' : 'claro')) }),
    [tema],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useTema() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useTema debe usarse dentro de <ProveedorTema>')
  return ctx
}
