# decisions_log

## 2026-03-15

### DEC-2026-001
- Decision: Adoptar baseline de artefactos `ai-memory/` segun SaaS-Factory v2.6.0.
- Motivo: Habilitar continuidad post-crash y trazabilidad operativa.
- Impacto: Se agregan `project_memory.yaml`, `session_state.md`, `decisions_log.md`.

### DEC-2026-002
- Decision: Incorporar `REPO_MAP.md` y `AI_CONTEXT.md` para gobernanza AI-native.
- Motivo: Reducir deriva arquitectonica y facilitar cambios seguros.
- Impacto: Se define mapa del repositorio, contexto tecnico y limites.

### DEC-2026-003
- Decision: Operar en modo resumen con artefacto versionado.
- Motivo: Cumplir regla de resumen explicito y reutilizable para contexto.
- Impacto: Se agrega `ai-memory/summaries/web_context_summary.md`.

## 2026-03-17

### DEC-2026-004
- Decision: Implementar buscador avanzado en home con Leaflet, manteniendo lenguaje visual existente.
- Motivo: Mejorar discovery y conversion sin romper identidad de marca.
- Impacto: Se agregan filtros por fecha, actividad, concierge mode, car class, mapa interactivo y API `/api/search`.

### DEC-2026-005
- Decision: Extender inventario operativo con car rental y concierge individual filtrable por servicio.
- Motivo: El equipo operativo necesita trazabilidad real por proveedor/servicio, no etiquetas genericas.
- Impacto: Se amplian `db/schema.sql`, `db/seed.sql`, fallback search y UI de filtros.

### DEC-2026-006
- Decision: Aplicar hardening de accesibilidad/performance en resultados de busqueda y formularios.
- Motivo: Cumplir skills de Web Interface Guidelines y reducir friccion en mobile.
- Impacto: Soporte de teclado en cards, textos de estado con elipsis, y fix de overflow en date inputs iPhone.
