# REPO_MAP

## Estructura actual
- `web.html`: unica aplicacion frontend (HTML/CSS/JS + i18n en linea).
- `vercel.json`: rewrite de `/` a `/web.html`.
- `.gitignore`: exclusiones locales (incluye `.vercel/`).
- `README.md`: guia operativa del servicio.
- `ai-memory/`: estado del protocolo (SSOT operacional y trazabilidad).
- `ai/playbooks/`: playbooks operativos para tareas repetibles.

## Dominios funcionales
- Presentacion y UX: contenido visual, secciones comerciales, CTA.
- Contenido multilenguaje: bloques `en`, `es`, `ar` en `web.html`.
- Despliegue: Vercel (produccion y alias de dominio).

## Ownership sugerido (SaaS-Factory)
- UX/UI y copy: AG-FE
- Arquitectura de artefactos y gobernanza: AG-ARCH
- Riesgo y cumplimiento: AG-QA / AG-SEC
- Deploy y plataforma: AG-INFRA

## Limites de responsabilidad
- Este repositorio no incluye backend, base de datos ni autenticacion.
- No hay integraciones de pago ni manejo de PII persistente del lado servidor.
- Cambios de negocio en copy y branding deben mantener consistencia visual e i18n.
