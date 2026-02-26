# Plan de implementación — 8 tareas ordenadas

Proyecto: **Gestor de Tareas ICE**  
Base: `README-minimum-spec-pack.md` + arquitectura definida

---

## Tarea 1 — Bootstrap del proyecto y base técnica

**Objetivo:** dejar la base del proyecto lista para implementar features.

- Crear proyecto con React + TypeScript + Vite.
- Instalar Material UI (`@mui/material`, `@emotion/react`, `@emotion/styled`).
- Configurar `src/app/theme.ts`.
- Crear estructura inicial de carpetas (`app`, `features`, `shared`).

**Entregable:** app arranca con layout mínimo y tema MUI aplicado.

---

## Tarea 2 — Modelo de dominio y reglas ICE

**Objetivo:** definir contratos y lógica de negocio pura.

- Definir tipos principales (`Task`, `TaskState`, `IceValues`, `ToastState`, etc.).
- Implementar `calculateICE` con validación de rangos 1–10.
- Implementar rangos de prioridad (Alta/Media/Baja).
- Implementar ordenamiento de tareas (no-hechas por ICE desc, luego hechas).

**Entregable:** módulo de dominio testeable de forma aislada (sin UI).

---

## Tarea 3 — Persistencia con inversión de dependencias (DIP)

**Objetivo:** desacoplar React de la tecnología de almacenamiento.

- Crear `PersistencePort`.
- Implementar `localStorage.adapter.ts`.
- Preparar `postgres.adapter.ts` como placeholder para futura migración.
- Crear `app/composition.ts` para inyección del adapter.

**Entregable:** React consume `PersistencePort`, no accede directo a `localStorage`.

---

## Tarea 4 — Estado global mínimo y reducer de tareas

**Objetivo:** centralizar estado de dominio y flags de UI.

- Implementar `tasks.reducer.ts` y acciones:
  - `ADD_TASK`
  - `UPDATE_TASK_FIELDS`
  - `UPDATE_ICE_VALUES`
  - `DELETE_TASK`
  - `REORDER_TASKS`
  - `SET_LOADING_TASK_ID`
- Montar `useReducer` en `App`.
- Añadir `useState` para `apiKey`, `confirmDialog`, `toast`, `loadingTaskId`.

**Entregable:** estado consistente, predecible y listo para conectar UI.

---

## Tarea 5 — Layout y shell de aplicación

**Objetivo:** construir la estructura visual principal.

- Implementar `AppShell`.
- Implementar `Header` (título, leyenda ICE, botón API Key).
- Diseñar layout responsive de dos zonas:
  - formulario de nueva tarea,
  - lista de tareas.
- Añadir estado vacío de lista.

**Entregable:** estructura de pantalla principal lista para conectar features.

---

## Tarea 6 — Flujo de tareas (CRUD + estado + prioridad visual)

**Objetivo:** completar la gestión funcional de tareas.

- Implementar `TaskForm`, `TaskList`, `TaskCard`.
- Implementar `TaskStateSelect`, `IceInputs`, `PriorityBadge`.
- Crear, editar y eliminar tareas.
- Cambiar estado de tarea.
- Recalcular ICE al editar I/C/E.
- Reordenar lista automáticamente tras cambios.

**Entregable:** gestión completa de tareas en UI con persistencia.

---

## Tarea 7 — API key, confirmaciones y notificaciones UX

**Objetivo:** cerrar la experiencia de uso base y evitar fricción.

- Implementar `ApiKeyModal` (bloqueante en primer uso).
- Implementar `ConfirmDialog` reutilizable para:
  - eliminar tarea,
  - marcar como hecha,
  - recalcular ICE.
- Implementar `Toast` (Snackbar + Alert) para éxito/error.

**Entregable:** UX consistente y controlada para acciones críticas.

---

## Tarea 8 — Integración Gemini y cierre MVP

**Objetivo:** habilitar priorización asistida por IA end-to-end.

- Implementar `geminiClient.ts`.
- Implementar `iceSuggestion.service.ts` (orquestación + parseo defensivo).
- Conectar botón “Calcular ICE” por tarea.
- Gestionar loading por tarjeta (`loadingTaskId`).
- Validar respuesta IA y no sobrescribir valores en error.
- Ejecutar checklist de Definition of Done.

**Entregable:** MVP funcional completo con cálculo ICE por IA.

---

## Orden recomendado de ejecución

1. Tarea 1  
2. Tarea 2  
3. Tarea 3  
4. Tarea 4  
5. Tarea 5  
6. Tarea 6  
7. Tarea 7  
8. Tarea 8

---

## Criterio de finalización global

El plan se considera terminado cuando el flujo completo funciona:

**entrada app → API key (si aplica) → crear tarea → calcular ICE con IA → confirmar/editar → persistir → reordenar por prioridad**.
