# Playbook: safe-content-edit

## Objetivo
Editar contenido de `web.html` sin alterar layout ni comportamiento no solicitado.

## Pasos
1. Localizar strings exactas a modificar (incluyendo i18n).
2. Aplicar cambios minimos y atomicos.
3. Verificar que no cambie estructura HTML/CSS fuera del alcance.
4. Revisar diff final antes de commit.

## Validacion
- `git diff -- web.html`
- Comprobacion visual basica en navegador.

## Riesgos
- Reemplazos globales pueden afectar textos no previstos.
