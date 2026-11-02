import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/misc'
import { AppLayout } from '@/components/layout/app-layout'
import { ProveedorTurnos } from '@/components/turnos/proveedor-turnos'
import { ProveedorSalon } from '@/store/salon'
import { ProveedorTema } from '@/store/tema'
import { PaginaHoy } from '@/paginas/hoy'
import { PaginaAgenda } from '@/paginas/agenda'
import { PaginaClientas } from '@/paginas/clientas'
import { PaginaFichaClienta } from '@/paginas/ficha-clienta'
import { PaginaWhatsapp } from '@/paginas/whatsapp'
import { PaginaCaja } from '@/paginas/caja'
import { PaginaServicios } from '@/paginas/servicios'
import { PaginaEquipo } from '@/paginas/equipo'
import { PaginaAjustes } from '@/paginas/ajustes'

export default function App() {
  return (
    <ProveedorTema>
      <ProveedorSalon>
        <TooltipProvider delayDuration={250}>
          <HashRouter>
            <ProveedorTurnos>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<PaginaHoy />} />
                  <Route path="agenda" element={<PaginaAgenda />} />
                  <Route path="clientas" element={<PaginaClientas />} />
                  <Route path="clientas/:id" element={<PaginaFichaClienta />} />
                  <Route path="whatsapp" element={<PaginaWhatsapp />} />
                  <Route path="caja" element={<PaginaCaja />} />
                  <Route path="servicios" element={<PaginaServicios />} />
                  <Route path="equipo" element={<PaginaEquipo />} />
                  <Route path="ajustes" element={<PaginaAjustes />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </ProveedorTurnos>
          </HashRouter>

          <Toaster
            position="bottom-right"
            duration={4000}
            toastOptions={{
              classNames: {
                toast:
                  'bg-surface! border-border! text-foreground! rounded-xl! shadow-lift! font-sans!',
                description: 'text-muted-foreground!',
                actionButton: 'bg-primary! text-primary-foreground!',
              },
            }}
          />
        </TooltipProvider>
      </ProveedorSalon>
    </ProveedorTema>
  )
}
