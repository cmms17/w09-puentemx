# Puente MX (w09)

Work that counts — Semana 9, Business Bending. Build individual sobre el consenso de equipo en
`BLUEPRINT_TEAM_Week9_Fusion.pdf`. Ver `docs/PACKET.md` para el diseño completo.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase (Postgres, Auth, RLS) + Vercel.
Dragon Stack: Google Gemini API (resumen para el revisor, nunca un veredicto) + estado
calculado a partir de qué filas existen (sin cron) + prueba portable emitida en el instante en
que el revisor firma.

## Desarrollo local

```bash
cp .env.example .env.local   # llena tus propias claves, nunca las subas
npm install
npm run dev
```

Corre la migración `supabase/migrations/20261012000000_esquema_puente_mx.sql` en tu proyecto de
Supabase antes del primer `npm run dev` — crea las tablas y una tarea de demo.

## Variables de entorno (solo en Vercel, nunca en el repo)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

## Rutas

- `/tarea` — pantalla del candidato: ve el alcance, envía su trabajo, agenda su defensa.
- `/panel/login` → `/panel` — panel del revisor humano (auth-gated), firma el veredicto.
- `/prueba/[token]` — página de prueba portable, propiedad del candidato.
