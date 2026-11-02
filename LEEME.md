# Tijera · Agenda del salón

Demo funcional del sistema descrito en `propuesta.html`: agenda de peluquería con
reservas automáticas por WhatsApp. Todo anda de verdad (crear turnos, cobrar,
cargar clientas, reservar desde el bot); los datos son de ejemplo y viven en el
navegador.

## Cómo mostrarla

**Opción rápida — para mostrarle al cliente**

Doble clic en `demo-agenda.html`. Es un único archivo, no necesita instalar ni
levantar nada, y se puede mandar por mail o WhatsApp.

**Opción desarrollo — para seguir trabajando**

```bash
cd app
npm install     # solo la primera vez
npm run dev     # http://localhost:5173
```

Para regenerar el archivo único después de un cambio:

```bash
cd app
npm run demo    # compila y actualiza ../demo-agenda.html
```

## Qué recorrer en una demostración

1. **Hoy** — la pantalla con la que abre el día: quién viene ahora, cuántos
   turnos faltan, cuánto se espera facturar, qué está sin confirmar y qué huecos
   quedan libres para vender.
2. **WhatsApp → Probar el asistente** — es el corazón de la propuesta. Escribí
   como si fueras una clienta ("quiero reservar un turno"). El asistente ofrece
   **solo horarios realmente libres** y, al elegir uno, el turno aparece en la
   agenda al instante.
3. **Agenda** — vista por profesional con los huecos punteados: se toca un hueco
   y se agenda ahí. La vista Semana muestra el pulso de los seis días.
4. **Clientas → Carolina Pereyra → Ficha técnica** — la fórmula de color exacta
   de cada visita. Es el dato que una peluquería no puede perder.
5. **Caja** — cuánto entró, cómo pagaron, qué produjo cada profesional y cuánta
   comisión hay que liquidar.

## Estructura

```
Propuesta-Agenda-Peluqueria/
├─ propuesta.html          Propuesta comercial (la que ya existía)
├─ demo-agenda.html        Demo completa en un solo archivo
└─ app/                    Código fuente
   ├─ src/
   │  ├─ lib/              Dominio: tipos, agenda, motor del bot, formato
   │  ├─ data/             Catálogo, clientas y generador de datos de ejemplo
   │  ├─ store/            Estado global (React Context + reducer)
   │  ├─ components/       UI base, layout, piezas y diálogos de turnos
   │  └─ paginas/          Hoy, Agenda, Clientas, WhatsApp, Caja, Servicios…
   └─ scripts/empaquetar.mjs   Arma el HTML único
```

## Detalles que conviene conocer

- **Los datos se regeneran cada día.** La agenda se arma alrededor de la fecha
  actual, así que la demo siempre se ve "viva". Los cambios que hagas quedan
  guardados en ese navegador; se borran con **Ajustes → Reiniciar datos de
  ejemplo**.
- **Nada se inventa al vuelo.** Los huecos libres, la ocupación, la caja y las
  comisiones salen de los mismos turnos que se ven en pantalla.
- **El bot es una máquina de estados real** (`src/lib/bot.ts`), no una animación:
  consulta la disponibilidad y crea el turno. En producción, lo que cambia es de
  dónde llegan los mensajes (API oficial de Meta) y dónde se guardan los datos
  (servidor con copias de seguridad).
- Funciona en modo claro y oscuro, y en teléfono, tablet y escritorio.

## Stack

React 19 + TypeScript + Vite · Tailwind CSS v4 · componentes propios sobre Radix
(estilo shadcn/ui) · Recharts · date-fns · lucide-react.
