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

## Dependencias
- Runtime: navegador web moderno
- Infra deploy: Vercel CLI
- Control de versiones: Git + GitHub

## Riesgos operativos
- Cambios globales de texto por reemplazo masivo pueden alterar copy no deseado.
- Cambios de branding pueden desalinear textos en i18n si no se valida en los 3 idiomas.
- Cambios en `vercel.json` pueden romper enrutamiento de la ruta raiz (`/`).
