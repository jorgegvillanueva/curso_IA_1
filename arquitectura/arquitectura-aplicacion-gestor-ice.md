# Arquitectura de la aplicación: Gestor de Tareas ICE

**Stack:** React + TypeScript + Vite + Material UI (MUI)  
**Modelo:** 100% frontend, sin backend, persistencia en `localStorage`  
**Objetivo:** Arquitectura didáctica, mantenible y simple para curso

---

## 1) Principios de arquitectura

- **Feature-first:** organizar por flujo funcional (`tasks`, `ice`, `apiKey`) en lugar de mezclar por tipo técnico.
- **Separación clara de responsabilidades:** UI, dominio, persistencia y acceso a API desacoplados.
- **Estado mínimo centralizado:** `useReducer` para tareas + flags de UI relacionadas; `useState` para modales/toast/key.
- **Efectos controlados:** persistencia y llamadas remotas encapsuladas en hooks/servicios.
- **Escalable sin sobreingeniería:** estructura compacta hoy, extensible mañana.

---

## 2) Estructura de carpetas recomendada

```txt
src/
  app/
    App.tsx
    main.tsx
    theme.ts
    composition.ts          # wiring de dependencias (elige adapters)

  features/
    apiKey/
      components/
        ApiKeyModal.tsx
      hooks/
        useApiKeyStorage.ts
      model/
        apiKey.types.ts

    tasks/
      components/
        TaskForm.tsx
        TaskList.tsx
        TaskCard.tsx
        TaskStateSelect.tsx
        IceInputs.tsx
      hooks/
        useTaskActions.ts
      model/
        tasks.types.ts
        tasks.reducer.ts
        tasks.selectors.ts

    ice/
      model/
        ice.types.ts
        ice.rules.ts          # calculateICE, rangos prioridad, validaciones
      services/
        iceSuggestion.service.ts  # orquesta llamada Gemini + parseo

  shared/
    ui/
      layout/
        AppShell.tsx
        Header.tsx
      feedback/
        ConfirmDialog.tsx
        Toast.tsx
      display/
        PriorityBadge.tsx

    services/
      geminiClient.ts         # cliente HTTP puro a Gemini
      persistence/
        persistence.port.ts   # contrato de persistencia (DIP)
        localStorage.adapter.ts
        postgres.adapter.ts   # futuro adapter (vía API/backend)

    lib/
      sorting.ts              # ordenamiento por estado+ICE
      validation.ts           # validaciones genéricas

    types/
      ui.types.ts             # ConfirmDialogState, ToastState, etc.
```

---

## 3) Responsabilidades por capa

### 3.1 `features/*`

- **apiKey:** captura/edición de API key, reglas de primer acceso.
- **tasks:** creación, edición, borrado, cambio de estado, render de lista/tarjetas.
- **ice:** reglas de negocio ICE y obtención de sugerencias IA.

### 3.2 `shared/ui`

- Componentes reutilizables no ligados a un feature.
- Sin lógica de dominio (solo presentación y eventos).

### 3.3 `shared/services`

- Integraciones externas (Gemini) sin estado global.
- Devuelven datos tipados o errores controlados.
- Persistencia desacoplada con **puerto + adapter** (inversión de dependencias).

### 3.4 `shared/lib`

- Funciones puras y utilitarias (sorting/validation).
- Sin dependencias de React.

---

## 3.5 Persistencia con inversión de dependencias (DIP)

React y los hooks no dependen de `localStorage` ni de PostgreSQL: dependen del contrato `PersistencePort`.

### Contrato de persistencia

```ts
export interface PersistencePort {
  loadTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  loadApiKey(): Promise<string>;
  saveApiKey(apiKey: string): Promise<void>;
}
```

### Adapter actual

- `localStorage.adapter.ts` implementa `PersistencePort` para el MVP.

### Adapter futuro (PostgreSQL)

- `postgres.adapter.ts` implementará el mismo contrato, normalmente llamando a un backend/API.
- React no cambia: solo se sustituye el adapter en `app/composition.ts`.

---

## 4) Modelo de estado recomendado

## Estado principal en `App`

- `tasks`: `Task[]` (gestionado con `useReducer`)
- `apiKey`: `string` (`useState`, inicializado desde storage)
- `confirmDialog`: estado UI (`open`, `intent`, `payload`) con `useState`
- `toast`: estado UI (`visible`, `message`, `type`) con `useState`
- `loadingTaskId`: `string | null` para el cálculo ICE por tarjeta

### 4.1 Evitar callbacks en estado modal

En vez de guardar `onConfirm` como función, usar intención tipada:

- `intent: 'deleteTask' | 'markDone' | 'recalculateIce'`
- `payload: { taskId: string }`

Ventajas:
- Menor acoplamiento
- Menos riesgo de closures obsoletos
- Flujo más predecible y fácil de testear

---

## 5) Gestión de datos y persistencia

### 5.1 Persistencia por contrato (`PersistencePort`)

- `tasks` y `apiKey` se leen/escriben a través de `PersistencePort`.
- `App` y hooks consumen solo la interfaz, no la tecnología concreta.
- El adapter real se resuelve en `app/composition.ts`.

### 5.2 Adapter inicial: `localStorage`

- MVP usa `localStorage.adapter.ts`.
- Carga inicial al montar: `loadTasks()` y `loadApiKey()`.
- Persistencia en cambios: `saveTasks()` y `saveApiKey()`.

### 5.3 Reglas de guardado

- Guardado inmediato tras acciones del usuario.
- En error de API, no sobreescribir valores ICE actuales.
- El parseo IA valida rango 1–10 para `impact/confidence/effort`.

---

## 6) Flujo funcional (alto nivel)

1. **App inicia** → resuelve dependencias en `composition.ts` y obtiene `PersistencePort`.
2. Lee `apiKey` y `tasks` con `persistence.loadApiKey()` y `persistence.loadTasks()`.
3. Si no hay key → muestra `ApiKeyModal` bloqueante.
4. Usuario crea tarea → reducer `ADD_TASK` → reordenamiento → `persistence.saveTasks(tasks)`.
5. Usuario calcula ICE:
   - marca `loadingTaskId`
   - llama a `iceSuggestion.service`
   - valida respuesta
   - reducer `UPDATE_ICE`
   - `persistence.saveTasks(tasks)`
   - limpia loading + toast success/error
6. Confirmaciones (eliminar / marcar hecha / recalcular) pasan por `ConfirmDialog`.

### 6.1 Wiring de infraestructura (`app/composition.ts`)

`composition.ts` es el único punto donde se elige el adapter:

```ts
import { createLocalStorageAdapter } from '../shared/services/persistence/localStorage.adapter';
// Futuro:
// import { createPostgresAdapter } from '../shared/services/persistence/postgres.adapter';

export const services = {
  persistence: createLocalStorageAdapter(),
};
```

Con esto, migrar persistencia no toca componentes React.

---

## 7) Acciones del reducer sugeridas

- `ADD_TASK`
- `UPDATE_TASK_FIELDS` (título/descripción/estado)
- `UPDATE_ICE_VALUES` (impact/confidence/effort + score + aiCalculated)
- `MARK_AI_CALCULATED`
- `DELETE_TASK`
- `REORDER_TASKS`
- `SET_LOADING_TASK_ID`

> Nota: `REORDER_TASKS` puede ser implícita en cada acción mutadora para evitar incoherencias en UI.

---

## 8) Contratos tipados clave

- `Task`
- `TaskState = 'esperando' | 'en_curso' | 'hecha'`
- `IceValues = { impact: number; confidence: number; effort: number }`
- `ConfirmIntent = 'deleteTask' | 'markDone' | 'recalculateIce'`
- `ToastState = { visible: boolean; message: string; type: 'success' | 'error' }`
- `PersistencePort` (contrato de persistencia)

---

## 9) Criterios de calidad de arquitectura

- Cada archivo tiene una responsabilidad clara.
- No hay lógica de dominio dentro de componentes visuales puros.
- No hay imports circulares entre features.
- Las reglas ICE existen en un único lugar (`features/ice/model/ice.rules.ts`).
- El acceso a Gemini existe en un único lugar (`shared/services/geminiClient.ts`).
- Los modales reutilizables no conocen el dominio, solo reciben estado/eventos.
- React depende de `PersistencePort`, no de infraestructura concreta.
- Cambiar almacenamiento implica cambiar adapter/wiring, no UI.

---

## 10) Evolución futura (sin romper base)

Si el proyecto crece:
- Añadir `Context` o `zustand` solo cuando aparezca prop drilling real.
- Cambiar `localStorage.adapter` por `postgres.adapter` (mismo contrato) cuando exista backend.
- Alternativamente, mover a IndexedDB con otro adapter si crece el volumen local.
- Añadir tests de reducer y reglas ICE como primera prioridad.
- Añadir tests de contrato para `PersistencePort` y reusar los mismos tests por adapter.
- Introducir i18n si se requiere internacionalización.

---

## Resumen ejecutivo

Esta arquitectura mantiene el MVP **simple para enseñanza** y, a la vez, evita los principales riesgos de mantenimiento:

- evita duplicidad entre `components` y `features`,
- reduce acoplamiento UI-dominio,
- encapsula Gemini y reglas ICE,
- aplica inversión de dependencias en persistencia (puerto + adapter),
- deja una base escalable sin sobrecargar al alumno.

