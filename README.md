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
- Filtros soportados: `checkIn`, `checkOut`, `activity`, `conciergeMode`, `conciergeService`, `carClass`, `guests`, `north`, `south`, `east`, `west`
- Actividades: villas, yates, water sports, concierge (paquete + individual), car rental (standard, premium, luxury)

## Portal operativo seguro
- URL interna: `/ops` (rewrite a `ops.html`).
- Endpoints auth: `POST /api/ops/auth/login`, `GET /api/ops/auth/me`, `POST /api/ops/auth/logout`.
- Endpoints CRUD listings: `GET|POST /api/ops/listings`, `POST /api/ops/listings-update`, `POST /api/ops/listings-delete`.
- Endpoints CRUD providers: `GET|POST /api/ops/providers`, `POST /api/ops/providers-update`, `POST /api/ops/providers-delete`.

Variables adicionales recomendadas:
- `OPS_SESSION_COOKIE` (opcional, default `vedara_ops_session`)
- `OPS_SESSION_TTL_HOURS` (opcional, default `12`)

Bootstrapping de usuario operativo:
1. Generar hash de password local:
   - `node -e "const {hashPassword}=require('./lib/ops-auth'); console.log(hashPassword('TU_PASSWORD_SEGURA'))"`
2. Insertar usuario en Supabase (ejemplo admin):
   - `insert into ops_users (email, role, password_hash, mfa_enabled, mfa_secret, active) values ('ops-admin@vedara.eu','admin','<HASH>',true,'<BASE32_TOTP_SECRET>',true);`
3. Para roles `editor` o `viewer`, `mfa_enabled` puede ser `false`.

Notas de seguridad:
- Admin requiere MFA TOTP habilitado (`mfa_enabled=true` + `mfa_secret` base32).
- Sesiones con cookie `HttpOnly`, `Secure`, `SameSite=Strict`.
- Endpoints mutables exigen `x-csrf-token`.
- Borrado de listings es soft delete (`active=false`, `deleted_at` no nulo).

SQL adicional sugerido:
- Ejecutar nuevamente `db/schema.sql` para aplicar campos nuevos de `providers` y `listings`.
- Bootstrap opcional de usuarios operativos: `db/ops_bootstrap.sql`.

## Dependencias
- Runtime: navegador web moderno
- Infra deploy: Vercel CLI
- Control de versiones: Git + GitHub

## Riesgos operativos
- Cambios globales de texto por reemplazo masivo pueden alterar copy no deseado.
- Cambios de branding pueden desalinear textos en i18n si no se valida en los 3 idiomas.
- Cambios en `vercel.json` pueden romper enrutamiento de la ruta raiz (`/`).
