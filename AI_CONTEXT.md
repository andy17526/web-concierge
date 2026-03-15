# AI_CONTEXT

## Producto
Sitio web estatico de marca Vedara para promocion de servicios premium en Ibiza: villas, yates, deportes acuaticos y concierge VIP.

## Stack tecnologico
- Frontend: HTML + CSS + JavaScript vanilla (archivo unico `web.html`)
- Backend: none
- Database: none
- Infraestructura: Vercel (hosting estatico), GitHub (source control)

## Dominios principales
- Brand & copy: textos de marca y narrativa comercial.
- UX sections: hero, servicios, villas, yates, formulario, footer.
- i18n: diccionario en `en`, `es`, `ar` embebido en JS.
- Deploy: configuracion de ruta raiz por `vercel.json`.

## Reglas arquitectonicas
- Mantener cambios atomicos y reversibles en `web.html`.
- Respetar estructura visual existente salvo solicitud explicita de rediseno.
- Validar consistencia de branding en HTML visible y strings i18n.
- No introducir dependencias/frameworks sin requerimiento explicito.
