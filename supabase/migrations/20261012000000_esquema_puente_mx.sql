-- Esquema de Puente MX (w09). Ninguna fila contiene un dato personal real:
-- el candidato, el empleador y el revisor de esta demo son ficticios
-- (Fernanda Ruiz, changarro La Providencia, Javier Null — ver PACKET.md
-- sección 2 y 9). Igual que en Primera Hora, RLS está activado sin
-- policies para anon/authenticated: toda lectura y escritura pasa por el
-- servidor con la Service Role Key (crearClienteSupabaseServidor). El
-- estado de cada envío (enviado → defensa agendada → verificado → prueba
-- emitida) NUNCA se guarda como columna — se calcula en cada lectura a
-- partir de qué timestamps existen, igual que calcularEstadoIncidente()
-- en w08. Un estado derivado de datos reales no se puede "no ejecutar";
-- un cron que avanza estado sí puede fallar en silencio.

create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  empleador_nombre text not null,
  empleador_demo boolean not null default true,
  compensacion_mxn integer not null,
  supervisor_nombre text not null,
  alcance text not null,
  creado_en timestamptz not null default now()
);

create table if not exists envios (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references tareas(id) on delete cascade,
  candidato_alias text not null,
  facturas_revisadas integer not null default 0,
  facturas_totales integer not null default 0,
  resumen_llm text,
  enviado_en timestamptz not null default now()
);

create table if not exists decisiones_juicio (
  id uuid primary key default gen_random_uuid(),
  envio_id uuid not null references envios(id) on delete cascade,
  titulo text not null,
  explicacion text not null
);

create table if not exists defensas (
  id uuid primary key default gen_random_uuid(),
  envio_id uuid not null unique references envios(id) on delete cascade,
  agendada_en timestamptz not null default now(),
  slot_propuesto text not null
);

create table if not exists verificaciones (
  id uuid primary key default gen_random_uuid(),
  envio_id uuid not null unique references envios(id) on delete cascade,
  revisor_email text not null,
  veredicto text not null check (veredicto in ('aprobado', 'rechazado', 'matizado')),
  comentario text not null,
  firmado_en timestamptz not null default now()
);

create table if not exists pruebas (
  id uuid primary key default gen_random_uuid(),
  envio_id uuid not null unique references envios(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  generado_en timestamptz not null default now()
);

create index if not exists idx_envios_tarea on envios(tarea_id);
create index if not exists idx_decisiones_envio on decisiones_juicio(envio_id);
create index if not exists idx_pruebas_token on pruebas(token);

alter table tareas enable row level security;
alter table envios enable row level security;
alter table decisiones_juicio enable row level security;
alter table defensas enable row level security;
alter table verificaciones enable row level security;
alter table pruebas enable row level security;

insert into tareas (titulo, descripcion, empleador_nombre, compensacion_mxn, supervisor_nombre, alcance)
values (
  'Conciliación de facturas',
  'Conciliar 24 facturas del mes, identificar discrepancias y explicar las decisiones de juicio tomadas.',
  'Changarro La Providencia (empleador demo)',
  450,
  'Javier Null, Admin.',
  'Conciliar 24 facturas'
)
on conflict do nothing;
