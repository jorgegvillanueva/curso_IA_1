# Minimum Spec Pack — Gestor de Tareas ICE

MVP didáctico para curso de React + TypeScript, enfocado en priorización de tareas con IA y arquitectura simple pero escalable.

---

## 1) Product Snapshot

- **Producto:** Gestor de Tareas Inteligente con modelo ICE.
- **Stack:** React + TypeScript + Vite + Material UI.
- **Modelo de despliegue:** 100% frontend (sin backend en MVP).
- **Persistencia actual:** `localStorage`.
- **IA:** Google Gemini API (Developer Free Tier).
- **Usuario objetivo:** público sin experiencia.

---

## 2) Objetivo del MVP

Permitir que una persona:
1. cree tareas,
2. obtenga sugerencias ICE (Impact, Confidence, Effort) desde una descripción usando IA,
3. priorice visualmente su backlog,
4. mantenga sus datos en el navegador.

---

## 3) Alcance funcional mínimo (In)

- Alta de tarea con:
  - `title` (obligatorio, máx. 100),
  - `description` (opcional, texto libre, máx. 200).
- Lista de tareas en tarjetas.
- Cálculo ICE por IA en cada tarea.
- Edición manual de `impact`, `confidence`, `effort` (1–10).
- Recalcular score al editar I/C/E.
- Estados de tarea: `esperando`, `en_curso`, `hecha`.
- Confirmaciones UI para:
  - eliminar tarea,
  - marcar tarea como hecha,
  - recalcular ICE si ya existía valor IA.
- Notificaciones de éxito/error (Toast).
- Configuración de API key en primer uso (modal).
- Persistencia de `tasks` y `apiKey` en `localStorage`.

---

## 4) Fuera de alcance (Out)

- Backend/API propia.
- Usuarios/autenticación.
- Filtros, búsqueda, etiquetas, paginación.
- Colaboración, sincronización cloud, tiempo real.
- Recordatorios/push/calendario.
- App móvil nativa.

---

## 5) Reglas de negocio ICE

### 5.1 Factores

- `impact`: 1–10 (10 = máximo impacto).
- `confidence`: 1–10 (10 = máxima certeza).
- `effort`: 1–10 (10 = muy difícil; penaliza score).

### 5.2 Fórmula

`ICE = round((impact * confidence) / effort)`  
Rango práctico: **0–100**, sin decimales.

### 5.3 Prioridad visual

- **Alta:** 67–100
- **Media:** 34–66
- **Baja:** 0–33

---

## 6) Flujo principal de usuario

1. App inicia.
2. Si no hay API key guardada, se abre modal bloqueante para guardarla.
3. Usuario crea tarea (título + descripción).
4. Tarea aparece en lista con valores ICE por defecto.
5. Usuario pulsa “Calcular ICE”.
6. App llama a Gemini, parsea y valida respuesta.
7. Se actualiza tarjeta con I/C/E y score ICE.
8. Se muestra toast de éxito (o error si falla la API/parseo).
9. Lista se reordena por prioridad.

---

## 7) UX mínima esperada

- **Navbar/Header:** título app, leyenda ICE, botón “API Key”.
- **Panel Nueva Tarea:** formulario simple y claro.
- **TaskList:** lista sin filtros.
- **TaskCard:** score, prioridad, estado, inputs ICE, acciones.
- **ConfirmDialog:** reutilizable para acciones críticas.
- **Toast (Snackbar+Alert):** feedback no bloqueante.

---

## 8) Arquitectura técnica mínima

## 8.1 Estructura (feature-first)

```txt
src/
  app/
    App.tsx
    main.tsx
    theme.ts
    composition.ts

  features/
    apiKey/
    tasks/
    ice/

  shared/
    ui/
    services/
      geminiClient.ts
      persistence/
        persistence.port.ts
        localStorage.adapter.ts
        postgres.adapter.ts   # futuro
    lib/
      sorting.ts
      validation.ts
    types/
```

## 8.2 Estado (sin Redux en MVP)

- `useReducer`: `tasks` + acciones de dominio.
- `useState`: `apiKey`, `confirmDialog`, `toast`, `loadingTaskId`.

## 8.3 Persistencia con DIP (inversión de dependencias)

- React depende de `PersistencePort`, no de `localStorage`.
- Adapter actual: `localStorage.adapter.ts`.
- Futuro: reemplazar por `postgres.adapter.ts` (vía backend) sin tocar componentes React.
- `app/composition.ts` define qué adapter se usa.

---

## 9) Contratos de datos mínimos

```ts
type TaskState = 'esperando' | 'en_curso' | 'hecha';

type Task = {
  id: string;
  title: string;
  description: string;
  state: TaskState;
  impact: number;
  confidence: number;
  effort: number;
  iceScore: number;
  aiCalculated: boolean;
  createdAt: number;
};
```

```ts
interface PersistencePort {
  loadTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  loadApiKey(): Promise<string>;
  saveApiKey(apiKey: string): Promise<void>;
}
```

---

## 10) Integración IA (Gemini)

- Endpoint `generateContent` con `apiKey` configurable por usuario.
- Prompt forzado a JSON con `impact/confidence/effort`.
- Parseo defensivo del primer objeto JSON de la respuesta.
- Validación de rango 1–10 antes de aplicar.
- En error: no sobrescribir valores actuales + toast de error.

---

## 11) Criterios de aceptación (Definition of Done)

- Crear/editar/eliminar tareas funciona.
- Modal API key se muestra solo cuando falta key.
- Cálculo ICE con IA actualiza tarjeta y score.
- Confirmaciones funcionan para eliminar/hecha/recalcular.
- Toasts de éxito/error visibles y claros.
- Persistencia de tareas y key entre recargas.
- Orden de lista correcto:
  - primero no-hechas por ICE desc,
  - luego hechas por ICE desc.
- No hay llamadas a `window.alert/confirm/prompt`.

---

## 12) Riesgos y mitigaciones clave

- **API key en frontend:** aceptado para MVP docente; no apto producción.
- **Respuesta IA no estricta:** parseo + validación + fallback visual (toast).
- **Acoplamiento de persistencia:** mitigado con `PersistencePort`.
- **Crecimiento futuro:** migración de adapter en `services/persistence` sin tocar UI.

---

## 13) Decisiones explícitas

- No Redux en MVP (estado actual no lo justifica).
- No backend en MVP.
- Sí a arquitectura por features.
- Sí a DIP en persistencia desde el inicio.

---

## 14) Plan de evolución (post-MVP)

1. Añadir backend y `postgres.adapter`.
2. Añadir tests de reducer y reglas ICE.
3. Añadir tests de contrato para `PersistencePort`.
4. Revisar necesidad real de Redux/Zustand si crece el estado compartido.

---

## 15) Documentos fuente del proyecto

- `mvp_gestor_tareas_ice.md`
- `arquitectura-aplicacion-gestor-ice.md`
- `revision-arquitectura-mvp-ice.md`
- `design/README.md`

---

Este documento está preparado para usarse como `README.md` del proyecto.
