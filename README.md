# Vedara Web

## Proposito
Landing page estatica de lujo para Vedara (experiencias, villas, yates y concierge en Ibiza), desplegada en Vercel.

## Comandos
- Desarrollo local: abrir `web.html` en navegador.
- Deploy produccion: `vercel --prod --yes`
- Estado git: `git status`

## Variables de entorno
Para envio de formularios (API en Vercel):

- `RESEND_API_KEY`: API key de Resend.
- `MAIL_TO`: correo destino de leads (recomendado `sales@vedara.eu`).
- `MAIL_FROM`: remitente autorizado en Resend (ejemplo `Vedara Website <onboarding@resend.dev>` o dominio verificado propio).
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key de Supabase (solo servidor).
- `ADMIN_API_KEY`: clave para endpoints internos operativos.

## Base de datos operativa
- Esquema SQL: `db/schema.sql`
- Datos iniciales: `db/seed.sql`

Flujo recomendado:
1. Ejecutar `db/schema.sql` en Supabase SQL editor.
2. Ejecutar `db/seed.sql` para cargar productos/proveedores base.
3. Configurar variables de entorno en Vercel.
4. Redeploy de produccion.

Endpoint interno (solo operacion):
- `GET /api/internal/leads?limit=50`
- Header requerido: `x-admin-key: <ADMIN_API_KEY>`

Busqueda avanzada (home):
- API: `GET /api/search`
- Filtros soportados: `checkIn`, `checkOut`, `activity`, `conciergeMode`, `carClass`, `guests`, `north`, `south`, `east`, `west`
- Actividades: villas, yates, water sports, concierge (paquete + individual), car rental (standard, premium, luxury)

## Dependencias
- Runtime: navegador web moderno
- Infra deploy: Vercel CLI
- Control de versiones: Git + GitHub

## Riesgos operativos
- Cambios globales de texto por reemplazo masivo pueden alterar copy no deseado.
- Cambios de branding pueden desalinear textos en i18n si no se valida en los 3 idiomas.
- Cambios en `vercel.json` pueden romper enrutamiento de la ruta raiz (`/`).
