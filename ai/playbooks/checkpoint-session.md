# Playbook: checkpoint-session

## Objetivo
Registrar un checkpoint operativo valido para continuidad de sesion.

## Pasos
1. Actualizar `ai-memory/session_state.md` con estado real.
2. Registrar decision en `ai-memory/decisions_log.md` si hubo cambios de alcance o arquitectura.
3. Verificar coherencia entre `CURRENT_PHASE`, `PHASE_STATUS` y `NEXT_STEP_EXACT`.

## Validacion
- `LAST_VALIDATED` actualizado en formato `YYYY-MM-DD HH:MM`.
- Estado reanudable sin historial conversacional.

## Riesgos
- Estado desactualizado (>7 dias) entra en STALE y bloquea ejecucion segun protocolo.
