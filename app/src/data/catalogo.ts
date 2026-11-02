import type {
  Ajustes,
  CategoriaServicio,
  HorarioSemanal,
  Profesional,
  Servicio,
} from '@/lib/tipos'

/* ---------------------------- Categorías ---------------------------- */

export const CATEGORIAS: Record<
  CategoriaServicio,
  { nombre: string; color: string; plural: string }
> = {
  corte: { nombre: 'Corte', plural: 'Cortes', color: '#A85C2E' },
  color: { nombre: 'Color', plural: 'Color', color: '#7C4B8B' },
  peinado: { nombre: 'Peinado', plural: 'Peinados', color: '#2F5D94' },
  tratamiento: { nombre: 'Tratamiento', plural: 'Tratamientos', color: '#2C7A6B' },
  unas: { nombre: 'Uñas', plural: 'Uñas', color: '#B8447A' },
  cejas: { nombre: 'Cejas y pestañas', plural: 'Cejas y pestañas', color: '#8A6D2F' },
  barberia: { nombre: 'Barbería', plural: 'Barbería', color: '#4A5A6B' },
}

export const colorCategoria = (c: CategoriaServicio) => CATEGORIAS[c].color

/* ----------------------------- Servicios ---------------------------- */

export const SERVICIOS: Servicio[] = [
  // Corte
  {
    id: 's-corte-dama',
    nombre: 'Corte de dama',
    categoria: 'corte',
    duracionMin: 45,
    procesadoMin: 0,
    precio: 950,
    descripcion: 'Lavado, corte y secado rápido.',
    online: true,
    activo: true,
  },
  {
    id: 's-corte-brushing',
    nombre: 'Corte + brushing',
    categoria: 'corte',
    duracionMin: 75,
    procesadoMin: 0,
    precio: 1450,
    descripcion: 'Corte con terminación de brushing y planchita.',
    online: true,
    activo: true,
  },
  {
    id: 's-corte-nino',
    nombre: 'Corte infantil',
    categoria: 'corte',
    duracionMin: 30,
    procesadoMin: 0,
    precio: 550,
    descripcion: 'Hasta 12 años.',
    online: true,
    activo: true,
  },
  {
    id: 's-flequillo',
    nombre: 'Retoque de flequillo',
    categoria: 'corte',
    duracionMin: 15,
    procesadoMin: 0,
    precio: 300,
    descripcion: 'Entre turnos, sin lavado.',
    online: true,
    activo: true,
  },

  // Color
  {
    id: 's-color-raiz',
    nombre: 'Color raíz',
    categoria: 'color',
    duracionMin: 90,
    procesadoMin: 35,
    precio: 2300,
    descripcion: 'Retoque de crecimiento con lavado y secado.',
    online: true,
    activo: true,
  },
  {
    id: 's-color-completo',
    nombre: 'Color completo',
    categoria: 'color',
    duracionMin: 120,
    procesadoMin: 40,
    precio: 3200,
    descripcion: 'Color de medios a puntas + raíz.',
    online: true,
    activo: true,
  },
  {
    id: 's-balayage',
    nombre: 'Balayage',
    categoria: 'color',
    duracionMin: 180,
    procesadoMin: 45,
    precio: 5200,
    descripcion: 'Barrido a mano alzada, matización incluida.',
    online: true,
    activo: true,
    requiereTest: true,
  },
  {
    id: 's-mechas',
    nombre: 'Mechas con papel',
    categoria: 'color',
    duracionMin: 150,
    procesadoMin: 40,
    precio: 4400,
    descripcion: 'Mechas finas con decolorante y toner.',
    online: true,
    activo: true,
    requiereTest: true,
  },
  {
    id: 's-matizacion',
    nombre: 'Matización / toner',
    categoria: 'color',
    duracionMin: 45,
    procesadoMin: 20,
    precio: 1300,
    descripcion: 'Neutraliza reflejos amarillos o anaranjados.',
    online: true,
    activo: true,
  },

  // Peinado
  {
    id: 's-brushing',
    nombre: 'Brushing',
    categoria: 'peinado',
    duracionMin: 45,
    procesadoMin: 0,
    precio: 800,
    descripcion: 'Lavado y modelado con cepillo.',
    online: true,
    activo: true,
  },
  {
    id: 's-peinado-fiesta',
    nombre: 'Peinado de fiesta',
    categoria: 'peinado',
    duracionMin: 60,
    procesadoMin: 0,
    precio: 1900,
    descripcion: 'Ondas, semirrecogido o recogido simple.',
    online: true,
    activo: true,
  },
  {
    id: 's-recogido-novia',
    nombre: 'Recogido de novia',
    categoria: 'peinado',
    duracionMin: 90,
    procesadoMin: 0,
    precio: 3800,
    descripcion: 'Incluye prueba previa coordinada aparte.',
    online: false,
    activo: true,
  },

  // Tratamientos
  {
    id: 's-hidratacion',
    nombre: 'Hidratación profunda',
    categoria: 'tratamiento',
    duracionMin: 60,
    procesadoMin: 20,
    precio: 1600,
    descripcion: 'Ampolla + vapor + sellado.',
    online: true,
    activo: true,
  },
  {
    id: 's-botox',
    nombre: 'Botox capilar',
    categoria: 'tratamiento',
    duracionMin: 120,
    procesadoMin: 40,
    precio: 3100,
    descripcion: 'Reduce frizz y aporta brillo. Dura 2 a 3 meses.',
    online: true,
    activo: true,
  },
  {
    id: 's-alisado',
    nombre: 'Alisado progresivo',
    categoria: 'tratamiento',
    duracionMin: 180,
    procesadoMin: 45,
    precio: 5400,
    descripcion: 'Sin formol. No lavar el pelo por 72 h.',
    online: true,
    activo: true,
    requiereTest: true,
  },
  {
    id: 's-nutricion',
    nombre: 'Nutrición con keratina',
    categoria: 'tratamiento',
    duracionMin: 90,
    procesadoMin: 30,
    precio: 2500,
    descripcion: 'Repara fibra dañada por decoloración.',
    online: true,
    activo: true,
  },

  // Uñas
  {
    id: 's-manicura',
    nombre: 'Manicura común',
    categoria: 'unas',
    duracionMin: 45,
    procesadoMin: 0,
    precio: 750,
    descripcion: 'Prolijado, cutícula y esmaltado tradicional.',
    online: true,
    activo: true,
  },
  {
    id: 's-semi',
    nombre: 'Esmaltado semipermanente',
    categoria: 'unas',
    duracionMin: 60,
    procesadoMin: 0,
    precio: 1150,
    descripcion: 'Dura hasta 3 semanas. Incluye retiro del anterior.',
    online: true,
    activo: true,
  },
  {
    id: 's-kapping',
    nombre: 'Kapping / esculpidas',
    categoria: 'unas',
    duracionMin: 90,
    procesadoMin: 0,
    precio: 1900,
    descripcion: 'Refuerzo en gel sobre uña natural o extensión.',
    online: true,
    activo: true,
  },
  {
    id: 's-pedicura',
    nombre: 'Pedicura completa',
    categoria: 'unas',
    duracionMin: 60,
    procesadoMin: 0,
    precio: 1050,
    descripcion: 'Baño, prolijado, exfoliación y esmaltado.',
    online: true,
    activo: true,
  },

  // Cejas y pestañas
  {
    id: 's-cejas',
    nombre: 'Diseño de cejas',
    categoria: 'cejas',
    duracionMin: 30,
    procesadoMin: 0,
    precio: 550,
    descripcion: 'Perfilado con pinza y cera.',
    online: true,
    activo: true,
  },
  {
    id: 's-henna',
    nombre: 'Perfilado + henna',
    categoria: 'cejas',
    duracionMin: 45,
    procesadoMin: 15,
    precio: 850,
    descripcion: 'Tinte natural que dura 2 semanas en la piel.',
    online: true,
    activo: true,
  },
  {
    id: 's-lifting',
    nombre: 'Lifting de pestañas',
    categoria: 'cejas',
    duracionMin: 60,
    procesadoMin: 20,
    precio: 1700,
    descripcion: 'Curvado permanente con nutrición. Dura 6 a 8 semanas.',
    online: true,
    activo: true,
  },

  // Barbería
  {
    id: 's-corte-caballero',
    nombre: 'Corte de caballero',
    categoria: 'barberia',
    duracionMin: 30,
    procesadoMin: 0,
    precio: 650,
    descripcion: 'Máquina y tijera, con lavado.',
    online: true,
    activo: true,
  },
  {
    id: 's-barba',
    nombre: 'Perfilado de barba',
    categoria: 'barberia',
    duracionMin: 30,
    procesadoMin: 0,
    precio: 500,
    descripcion: 'Navaja, toalla caliente y aceite.',
    online: true,
    activo: true,
  },
  {
    id: 's-corte-barba',
    nombre: 'Corte + barba',
    categoria: 'barberia',
    duracionMin: 50,
    procesadoMin: 0,
    precio: 1000,
    descripcion: 'Combo completo.',
    online: true,
    activo: true,
  },
]

/* --------------------------- Horarios base --------------------------- */

const horario = (dias: Partial<Record<number, [string, string][]>>): HorarioSemanal => {
  const base: HorarioSemanal = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const [dia, tramos] of Object.entries(dias)) {
    base[Number(dia) as keyof HorarioSemanal] = (tramos ?? []).map(([inicio, fin]) => ({
      inicio,
      fin,
    }))
  }
  return base
}

/** Corrido de 9 a 19, sábado hasta las 17. */
const HORARIO_COMPLETO = horario({
  1: [['09:00', '19:00']],
  2: [['09:00', '19:00']],
  3: [['09:00', '19:00']],
  4: [['09:00', '20:00']],
  5: [['09:00', '20:00']],
  6: [['09:00', '17:00']],
})

/** Media jornada con corte al mediodía. */
const HORARIO_TARDE = horario({
  2: [['13:00', '20:00']],
  3: [['13:00', '20:00']],
  4: [['13:00', '20:00']],
  5: [['11:00', '20:00']],
  6: [['09:00', '17:00']],
})

const HORARIO_UNAS = horario({
  1: [
    ['10:00', '14:00'],
    ['15:00', '19:00'],
  ],
  2: [
    ['10:00', '14:00'],
    ['15:00', '19:00'],
  ],
  3: [
    ['10:00', '14:00'],
    ['15:00', '19:00'],
  ],
  4: [
    ['10:00', '14:00'],
    ['15:00', '20:00'],
  ],
  5: [
    ['10:00', '14:00'],
    ['15:00', '20:00'],
  ],
  6: [['09:00', '15:00']],
})

const HORARIO_BARBERIA = horario({
  2: [['11:00', '20:00']],
  3: [['11:00', '20:00']],
  4: [['11:00', '20:00']],
  5: [['11:00', '20:00']],
  6: [['09:00', '17:00']],
})

/* --------------------------- Profesionales -------------------------- */

export const PROFESIONALES: Profesional[] = [
  {
    id: 'p-valeria',
    nombre: 'Valeria Núñez',
    rol: 'Colorista senior · Dueña',
    color: '#A85C2E',
    telefono: '+59899412330',
    comision: 0,
    categorias: ['color', 'corte', 'tratamiento', 'peinado'],
    horario: HORARIO_COMPLETO,
    activo: true,
    desde: '2016-03-01',
  },
  {
    id: 'p-sofia',
    nombre: 'Sofía Méndez',
    rol: 'Estilista',
    color: '#7C4B8B',
    telefono: '+59897225841',
    comision: 40,
    categorias: ['corte', 'peinado', 'color', 'tratamiento'],
    horario: HORARIO_TARDE,
    activo: true,
    desde: '2021-08-15',
  },
  {
    id: 'p-camila',
    nombre: 'Camila Rodríguez',
    rol: 'Manicura y cejas',
    color: '#B8447A',
    telefono: '+59894118702',
    comision: 45,
    categorias: ['unas', 'cejas'],
    horario: HORARIO_UNAS,
    activo: true,
    desde: '2022-02-01',
  },
  {
    id: 'p-martin',
    nombre: 'Martín Pereira',
    rol: 'Barbero',
    color: '#4A5A6B',
    telefono: '+59891560234',
    comision: 45,
    categorias: ['barberia', 'corte'],
    horario: HORARIO_BARBERIA,
    activo: true,
    desde: '2024-05-06',
  },
]

/* ------------------------------ Ajustes ----------------------------- */

export const AJUSTES: Ajustes = {
  salon: {
    nombre: 'Salón Marié',
    direccion: 'Av. Brasil 2570, Pocitos · Montevideo',
    telefono: '+59827094412',
    whatsapp: '+59899412330',
    moneda: 'UYU',
  },
  horario: HORARIO_COMPLETO,
  agenda: {
    intervaloMin: 15,
    horaApertura: '09:00',
    horaCierre: '20:00',
    colchonMin: 0,
  },
  politicas: {
    cancelacionHoras: 12,
    seniaPorcentaje: 30,
    seniaDesdeMonto: 3000,
    permitirCancelarPorWhatsapp: true,
    maxDiasAnticipacion: 60,
  },
  recordatorios: {
    activo: true,
    horasAntes: 24,
    plantilla:
      'Hola {nombre}! Te recordamos tu turno de {servicio} mañana a las {hora} con {profesional} en Salón Marié. Respondé *1* para confirmar o *2* si no vas a poder venir.',
  },
  bot: {
    activo: true,
    bienvenida:
      'Hola! Soy el asistente de Salón Marié 💇‍♀️ Puedo tomarte un turno en menos de un minuto. ¿Qué querés hacer?',
    fueraDeHora:
      'Ahora el salón está cerrado, pero podés reservar igual: elegí el servicio y te muestro los horarios libres.',
    derivarAHumano: true,
  },
}
