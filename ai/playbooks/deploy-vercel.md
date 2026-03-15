# Playbook: deploy-vercel

## Objetivo
Publicar la version actual en produccion Vercel.

## Pasos
1. Confirmar cambios en git (`git status`).
2. Asegurar commit/push al branch principal.
3. Ejecutar `vercel --prod --yes`.
4. Validar URL de produccion y alias de dominio.

## Validacion
- Respuesta 200 en URL de produccion.
- Confirmar que `/` carga `web.html` via `vercel.json`.

## Riesgos
- Alias DNS/SSL puede tardar en propagarse.
