/* ============================================================
   Modelo de dominio de una peluquería
   ============================================================ */

export type ID = string

/* -------------------------------- Servicios ------------------------------- */

export type CategoriaServicio =
  | 'corte'
  | 'color'
  | 'peinado'
  | 'tratamiento'
  | 'unas'
  | 'cejas'
  | 'barberia'

export interface Servicio {
  id: ID
  nombre: string
  categoria: CategoriaServicio
  /** Minutos que el turno ocupa en la agenda, de punta a punta. */
  duracionMin: number
  /**
   * Minutos de procesado (tinte actuando, gorro, secado con casco) en los que
   * la profesional queda libre y puede atender a otra clienta.
   */
  procesadoMin: number
  precio: number
  descripcion: string
  /** Se ofrece en el menú del bot de WhatsApp. */
  online: boolean
  activo: boolean
  /** Requiere prueba de mecha / test de alergia previo. */
  requiereTest?: boolean
}

/* ------------------------------ Profesionales ----------------------------- */

/** 0 = domingo … 6 = sábado (igual que Date.getDay). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Tramo {
  inicio: string // "09:00"
  fin: string // "18:00"
}

export type HorarioSemanal = Record<DiaSemana, Tramo[]>

export interface Profesional {
  id: ID
  nombre: string
  rol: string
  color: string
  telefono: string
  /** Comisión sobre servicios, en porcentaje. */
  comision: number
  categorias: CategoriaServicio[]
  horario: HorarioSemanal
  activo: boolean
  desde: string
}

/* --------------------------------- Clientas ------------------------------- */

export interface FichaTecnica {
  fecha: string
  formula: string
  observacion?: string
  profesionalId: ID
}

export interface Clienta {
  id: ID
  nombre: string
  telefono: string
  email?: string
  /** Etiquetas operativas: VIP, Nueva, Recurrente, Riesgo… */
  etiquetas: string[]
  notas?: string
  /** Advertencias que deben saltar antes de atenderla (alergias, sensibilidad). */
  alertas: string[]
  desde: string
  cumple?: string // "MM-DD"
  profesionalPreferidoId?: ID
  fichaTecnica: FichaTecnica[]
}

/* ---------------------------------- Turnos -------------------------------- */

export type EstadoTurno =
  | 'pendiente'
  | 'confirmado'
  | 'en_curso'
  | 'completado'
  | 'no_asistio'
  | 'cancelado'

export type OrigenTurno = 'whatsapp' | 'manual' | 'walkin'

export type MetodoPago = 'efectivo' | 'debito' | 'credito' | 'transferencia'

export interface Pago {
  metodo: MetodoPago
  monto: number
  propina: number
  fecha: string
}

export interface Turno {
  id: ID
  /** Código corto que se le pasa a la clienta por WhatsApp. */
  codigo: string
  clientaId: ID
  profesionalId: ID
  serviciosIds: ID[]
  inicio: string // ISO
  fin: string // ISO
  estado: EstadoTurno
  origen: OrigenTurno
  precioTotal: number
  senia: number
  notas?: string
  pago?: Pago
  recordatorioEnviado: boolean
  creadoEn: string
}

export interface Bloqueo {
  id: ID
  /** 'todos' bloquea la agenda completa (feriado, corte de luz, evento). */
  profesionalId: ID | 'todos'
  inicio: string
  fin: string
  motivo: string
}

/* -------------------------------- WhatsApp -------------------------------- */

export type AutorMensaje = 'clienta' | 'bot' | 'salon'

export interface MensajeWA {
  id: ID
  autor: AutorMensaje
  texto: string
  hora: string // ISO
  /** Botones interactivos que mostró el bot en ese mensaje. */
  botones?: string[]
}

export type EstadoConversacion = 'bot' | 'humano' | 'cerrada'

export interface Conversacion {
  id: ID
  clientaId?: ID
  nombreContacto: string
  telefono: string
  estado: EstadoConversacion
  mensajes: MensajeWA[]
  turnoId?: ID
  sinLeer: number
  ultimaActividad: string
}

/* ------------------------------ Lista de espera --------------------------- */

export interface EnEspera {
  id: ID
  clientaId: ID
  servicioId: ID
  profesionalId?: ID
  preferencia: string
  creadoEn: string
}

/* --------------------------------- Ajustes -------------------------------- */

export interface Ajustes {
  salon: {
    nombre: string
    direccion: string
    telefono: string
    whatsapp: string
    moneda: string
  }
  horario: HorarioSemanal
  agenda: {
    /** Granularidad de la grilla, en minutos. */
    intervaloMin: number
    horaApertura: string
    horaCierre: string
    /** Colchón entre turnos para limpiar la estación. */
    colchonMin: number
  }
  politicas: {
    cancelacionHoras: number
    seniaPorcentaje: number
    seniaDesdeMonto: number
    permitirCancelarPorWhatsapp: boolean
    maxDiasAnticipacion: number
  }
  recordatorios: {
    activo: boolean
    horasAntes: number
    plantilla: string
  }
  bot: {
    activo: boolean
    bienvenida: string
    fueraDeHora: string
    derivarAHumano: boolean
  }
}

/* ------------------------------ Estado global ----------------------------- */

export interface EstadoSalon {
  servicios: Servicio[]
  profesionales: Profesional[]
  clientas: Clienta[]
  turnos: Turno[]
  bloqueos: Bloqueo[]
  conversaciones: Conversacion[]
  espera: EnEspera[]
  ajustes: Ajustes
}
