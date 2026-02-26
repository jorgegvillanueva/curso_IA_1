# MVP: Gestor de Tareas Inteligente con ICE

**Versión:** 2.2 (revisada por arquitecto)  
**Fecha:** 24 de febrero de 2026  
**Stack:** React + Vite · Material UI (MUI v5) · 100 % frontend · sin backend · Google Gemini API (Developer Free Tier)  
**Público:** Alumnos sin experiencia previa en React

---

## 1. Objetivo

Aplicación React de una sola página que permite crear y gestionar tareas con tres estados, priorizarlas automáticamente mediante el modelo ICE usando la IA de Google Gemini (desde el navegador, sin servidor), y persiste todo en `localStorage`.  
Es el proyecto central de un curso de React: código simple, real y explicable línea a línea.

---

## 2. Modelo ICE (definición cerrada)

| Factor | Clave | Escala | Significado |
|--------|-------|--------|-------------|
| Impacto | `impact` | 1–10 | ¿Cuánto impacta si se hace bien? 10 = máximo impacto. |
| Confianza | `confidence` | 1–10 | ¿Cuánta certeza hay de que funcionará? 10 = total certeza. |
| Esfuerzo | `effort` | 1–10 | ¿Cuánto cuesta hacerlo? 10 = muy difícil. **Penaliza el score.** |

**Fórmula:**

```
ICE = round( (impact × confidence) / effort )
```

- Rango resultante: **0–100** (entero, sin decimales).
- Valor máximo teórico: (10 × 10) / 1 = **100**.
- Valor mínimo teórico: (1 × 1) / 10 = 0.1 → **0**.
- Guardia obligatoria: si `effort = 0` por error, tratar como `effort = 1`.
- A mayor puntuación ICE → mayor prioridad.

**Valor por defecto al crear tarea:** `impact = 5`, `confidence = 5`, `effort = 5` → ICE inicial = **5**.

---

## 3. Modelo de datos (tarea)

```javascript
{
  id:          string,   // Date.now().toString() al crear
  title:       string,   // Obligatorio. Máx. 100 caracteres.
  description: string,   // Opcional. Máx. 200 caracteres.
  state:       'esperando' | 'en_curso' | 'hecha',  // ver §4
  impact:      number,   // 1–10, default 5
  confidence:  number,   // 1–10, default 5
  effort:      number,   // 1–10, default 5
  iceScore:    number,   // 0–100, entero. Se recalcula al cambiar I/C/E.
  aiCalculated: boolean, // true si el ICE fue calculado por Gemini
  createdAt:   number    // timestamp (Date.now())
}
```

---

## 4. Estados de tarea

| Estado | Valor | Color sugerido | Significado |
|--------|-------|----------------|-------------|
| Esperando | `esperando` | Gris (`#9E9E9E`) | Tarea pendiente, no iniciada |
| En curso | `en_curso` | Azul (`#1976D2`) | Tarea actualmente en progreso |
| Hecha | `hecha` | Verde (`#388E3C`) | Tarea completada |

**Transiciones permitidas:** cualquier estado puede cambiar a cualquier otro (sin restricción de flujo).  
**Sin filtros**: la lista siempre muestra todas las tareas, ordenadas por ICE descendente.  
**Las tareas "hecha" se muestran al final de la lista**, por encima del ordenamiento ICE, para no mezclarlas con las activas. Orden final:  
1. Tareas no terminadas, ordenadas por ICE descendente.
2. Tareas "hecha", ordenadas por ICE descendente.

---

## 5. Funcionalidades incluidas (alcance cerrado)

| # | Funcionalidad | Descripción | Complejidad |
|---|---------------|-------------|-------------|
| F0 | Configuración de API key | Al abrir la app, si no hay key en `localStorage`, se muestra un modal con un input para introducirla. Se guarda en `localStorage`. Botón "⚙ API Key" en el header permite cambiarla. | Baja |
| F1 | Añadir tarea | Formulario: título (obligatorio, máx. 100 caracteres) y descripción (opcional, máx. 200 caracteres). Al guardar: I/C/E = 5, ICE = 5, estado = "esperando". | Baja |
| F2 | Lista de tareas | Todas las tareas en tarjetas, ordenadas según §4. | Baja |
| F3 | Calcular ICE con IA | Botón "✨ Calcular ICE" en cada tarjeta. Llama a Gemini con título + descripción. Actualiza I, C, E y score. | Media |
| F4 | Edición manual de I / C / E | Tres inputs numéricos (1–10) en cada tarjeta. El ICE se recalcula en tiempo real al cambiar cualquiera. | Baja |
| F5 | Cambiar estado | Selector `<select>` en cada tarjeta con los tres valores. Confirmación al marcar como "hecha" (ver §6). | Baja |
| F6 | Eliminar tarea | Botón "🗑 Eliminar" en cada tarjeta. Requiere confirmación (ver §6). | Baja |
| F7 | Persistencia local | `localStorage`: guardar al crear/editar/eliminar; leer al montar la app. Incluye la API key. | Baja |
| F8 | Indicador de prioridad | Badge de color en la tarjeta según ICE (ver §7). | Baja |

---

## 6. Confirmaciones y notificaciones (UX con Material UI)

No se usan `window.alert()`, `window.confirm()` ni `window.prompt()`. Todos los diálogos y mensajes se construyen con componentes de **Material UI (MUI v5)**.

### 6.1 ConfirmModal (componente reutilizable)

Un único componente `ConfirmModal.jsx` que se controla desde el estado de `App`:

```javascript
// Estado en App.jsx
const [confirmModal, setConfirmModal] = useState({
  open: false,
  title: '',
  message: '',
  onConfirm: null
});
```

El modal se abre pasando título, mensaje y callback; si el usuario cancela, no se ejecuta nada.

| Acción | Título del modal | Mensaje |
|--------|-----------------|---------|
| **Eliminar tarea** | `¿Eliminar tarea?` | `¿Eliminar "${título}"? Esta acción no se puede deshacer.` |
| **Marcar como "hecha"** | `¿Marcar como hecha?` | `¿Seguro que quieres marcar "${título}" como hecha?` |
| **Recalcular ICE** (si ya tiene IA activa) | `¿Recalcular ICE?` | `Esta tarea ya tiene ICE calculado por IA (${score}). ¿Sobrescribir?` |

Botones del modal: **[Cancelar]** (`<Button variant="text">`) y **[Confirmar]** (`<Button variant="contained" color="error">` para eliminar, `color="primary"` para el resto). Implementado con `<Dialog>`, `<DialogTitle>`, `<DialogContent>` y `<DialogActions>` de MUI.

```
┌─────────────────────────────────┐
│  ¿Eliminar tarea?               │
│  ─────────────────────────────  │
│  ¿Eliminar "Implementar login"? │
│  Esta acción no se puede        │
│  deshacer.                      │
│                                 │
│         [Cancelar] [Eliminar]   │
└─────────────────────────────────┘
```

### 6.2 Toast (notificaciones)

Un componente `Toast.jsx` que usa `<Snackbar>` + `<Alert>` de MUI, anclado en la esquina inferior derecha. Se auto-cierra a los 3 segundos mediante la prop `autoHideDuration={3000}` del propio `<Snackbar>` (sin necesidad de `setTimeout` manual).

```javascript
// Estado en App.jsx
const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

// Helpers
const showError = (msg) => setToast({ visible: true, message: msg, type: 'error' });
const showSuccess = (msg) => setToast({ visible: true, message: msg, type: 'success' });
```

| Evento | Tipo | Mensaje |
|--------|------|---------|
| API falla (red, 429, 500) | `error` | `No se pudo calcular el ICE. Puedes introducir los valores manualmente.` |
| Parseo de JSON falla | `error` | `La IA devolvió una respuesta inesperada. Inténtalo de nuevo.` |
| ICE calculado con éxito | `success` | `ICE calculado correctamente (score: ${score}).` |
| Tarea añadida | `success` | `Tarea "${título}" añadida.` |

Los valores de I/C/E no se modifican si hay error.

```
                          ┌────────────────────────────────┐
                          │ ✓ ICE calculado correctamente  │  ← MUI <Alert severity="success">
                          │   (score: 72)             [✕]  │
                          └────────────────────────────────┘
```

### 6.3 ApiKeyModal (primer uso y cambio de key)

Modal especial `ApiKeyModal.jsx` que aparece al montar la app si no hay key guardada, o al pulsar "⚙ API Key" en el header.

```
┌────────────────────────────────────────┐
│  🔑 Configura tu API Key de Gemini     │
│  ────────────────────────────────────  │
│  Introduce tu Google Gemini API Key.   │
│  Se guardará solo en este navegador.   │
│                                        │
│  [AIza••••••••••••••••••••••••    ]    │
│                                        │
│  ⚠ La key se guarda en localStorage.  │
│  No la compartas.                      │
│                                        │
│                    [Cancelar] [Guardar]│
└────────────────────────────────────────┘
```

- El campo es `<input type="password">` para ocultar el valor.
- Botón "Guardar" deshabilitado si el campo está vacío.
- Si el usuario abre el modal con key existente, el campo muestra el valor enmascarado.
- "Cancelar" solo disponible si ya existe una key guardada (no se puede cerrar sin key en el primer uso).

---

## 7. Indicador visual de prioridad ICE

| ICE | Etiqueta | Color del badge |
|-----|----------|-----------------|
| 67–100 | Alta | Verde (`#388E3C`) |
| 34–66 | Media | Naranja (`#F57C00`) |
| 0–33 | Baja | Rojo (`#D32F2F`) |

---

## 8. Integración con Google Gemini API

### 8.1 Por qué Gemini

- **CORS** permitido desde el navegador con API key como query param.
- **Free Tier** (Developer) sin tarjeta de crédito requerida.
- Sin límites preocupantes para uso en curso (15 RPM en gemini-2.0-flash).

### 8.2 Endpoint y modelo

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}
```

La API key **no usa `.env`**. Se obtiene del estado de la app, que la carga de `localStorage` al iniciar:

```javascript
// storage.js
export const getApiKey = () => localStorage.getItem('gemini_api_key') ?? '';
export const saveApiKey = (key) => localStorage.setItem('gemini_api_key', key);

// App.jsx — al montar
const [apiKey, setApiKey] = useState(() => getApiKey());
```

La función `askGeminiForICE` recibe la key como parámetro:

```javascript
askGeminiForICE(title, description, apiKey)
```

### 8.3 Prompt exacto (enviado a Gemini)

```
Eres un asistente de priorización de tareas.
Analiza la siguiente tarea y devuelve ÚNICAMENTE un objeto JSON con tres claves:
- "impact": número del 1 al 10 (impacto en el resultado si se hace bien; 10 = máximo)
- "confidence": número del 1 al 10 (certeza de que funcionará; 10 = total certeza)
- "effort": número del 1 al 10 (esfuerzo o dificultad; 10 = muy difícil)

No incluyas texto adicional, solo el JSON.

Tarea:
Título: {título}
Descripción: {descripción}
```

### 8.4 Parseo de la respuesta

1. Extraer el texto de `response.candidates[0].content.parts[0].text`.
2. Buscar el primer objeto JSON en el texto con una regex: `/\{[\s\S]*?\}/`.
3. Hacer `JSON.parse()` sobre ese fragmento.
4. Validar que `impact`, `confidence`, `effort` existen y están en rango 1–10.
5. Si cualquier paso falla → ir al §8.5.

### 8.5 Manejo de errores

Si la llamada a la API falla (error de red, 429, 500) **o** el parseo del JSON falla, se muestra un **Toast de error** (ver §6.2). No se usan `alert()` del sistema.

No se modifican los valores actuales de la tarea. El usuario puede editar I/C/E a mano (F4).

### 8.6 Estado de carga

Mientras la petición está en vuelo:
- El botón "✨ Calcular ICE" muestra "Calculando…" y queda deshabilitado.
- Los inputs I/C/E de esa tarjeta quedan deshabilitados.
- No hay spinner ni loading global; solo el botón cambia.

### 8.7 Nota de seguridad (para el curso)

La API key se guarda en `localStorage` del navegador: cualquier script de la página puede leerla y queda expuesta en las DevTools. **Solo para uso docente/desarrollo.**  
En producción real haría falta un backend que actúe de proxy y mantenga la key en el servidor.  
Incluir este punto como lección explícita en el curso: qué es `localStorage`, sus límites de privacidad y cuándo no es suficiente.

---

## 9. Diseño de interfaz (propuesta UX)

### 9.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 Gestor de Tareas ICE                          [leyenda] │  ← Header
├──────────────────┬──────────────────────────────────────────┤
│  NUEVA TAREA     │  MIS TAREAS (N)            [↑ ICE ↓ ICE]│
│  ┌────────────┐  │  ┌──────────────────────────────────────┐│
│  │ Título *   │  │  │ [Alta] Implementar login          100 ││
│  └────────────┘  │  │ En curso · I:10 C:10 E:1             ││
│  ┌────────────┐  │  │ Descripción corta…                   ││
│  │ Descripción│  │  │ [✨ Calcular] [Editar ICE] [🗑]      ││
│  │ (200)      │  │  ├──────────────────────────────────────┤│
│  └────────────┘  │  │ [Media] Crear tests unitarios      42 ││
│  [Añadir tarea]  │  │ Esperando · I:7 C:6 E:1              ││
│                  │  │ …                                     ││
│                  │  └──────────────────────────────────────┘│
└──────────────────┴──────────────────────────────────────────┘
```

- **Desktop:** dos columnas (formulario izquierda ~30 %, lista derecha ~70 %).
- **Mobile:** columna única (formulario arriba, lista abajo).

### 9.2 Tarjeta de tarea

```
┌──────────────────────────────────────────────────────────────┐
│  [ALTA ●]  Implementar login con JWT               ICE: 100  │
│  ─────────────────────────────────────────────────────────── │
│  Crear formulario de login, llamar al API REST y guardar     │
│  el token en localStorage.                                   │
│                                                              │
│  Estado: [En curso ▼]    ✨ calculado por IA                 │
│                                                              │
│  Impacto [10] Confianza [10] Esfuerzo [1]                    │
│                                                              │
│  [✨ Calcular ICE]                      [🗑 Eliminar]        │
└──────────────────────────────────────────────────────────────┘
```

- El badge de prioridad (ALTA / MEDIA / BAJA) es un `<Chip>` de MUI con el color definido en §7 (`color="success"` / `color="warning"` / `color="error"`).
- El selector de estado es un `<TextField select>` de MUI (equivalente a `<Select>` con label).
- Los inputs I/C/E son `<TextField type="number" inputProps={{ min:1, max:10 }}` de MUI.
- El ICE se recalcula y se muestra en tiempo real al editar I/C/E.
- Si `aiCalculated = true`, mostrar un `<Chip size="small" label="✨ IA" color="info">` junto al estado.

### 9.3 Formulario de nueva tarea

- **Título:** `<TextField fullWidth label="¿Qué hay que hacer?" required inputProps={{ maxLength: 100 }}>`.
- **Descripción:** `<TextField fullWidth multiline rows={3} label="Descripción (opcional)" inputProps={{ maxLength: 200 }}>` + `helperText={`${desc.length} / 200`}` para el contador.
- **Botón:** `<Button variant="contained" disabled={!título}>Añadir tarea</Button>`.
- Al añadir: limpiar formulario y hacer scroll suave hasta la nueva tarjeta.

### 9.4 Header

- Título de la app: **🧠 Gestor de Tareas ICE**.
- Leyenda siempre visible (texto pequeño): "ICE = (Impacto × Confianza) / Esfuerzo · escala 0–100".
- Botón **"⚙ API Key"** (`<Button variant="text" size="small">`, esquina derecha): abre el `ApiKeyModal` para cambiar la key guardada.

---

## 10. Estructura técnica sugerida

### 10.1 Stack

- **React 18+** con **Vite**.
- **Material UI v5** (`@mui/material` + `@emotion/react` + `@emotion/styled`): proporciona `Button`, `TextField`, `Select`, `Chip`, `Dialog`, `Snackbar`, `Alert`, `AppBar`, `Card`, etc.
- **Estado:** `useState` + `useEffect` (sin Redux ni Context en MVP).
- **Persistencia:** `localStorage` (tareas + API key; leer al montar con `useEffect`, guardar con `useEffect` cada vez que cambia el array de tareas).
- **HTTP:** `fetch` nativo.
- Sin CSS propio ni librería de estilos adicional; toda la apariencia viene de MUI.

### 10.2 Estructura de carpetas

```
src/
  components/
    TaskForm.jsx      # Formulario de nueva tarea
    TaskList.jsx      # Contenedor de la lista ordenada
    TaskCard.jsx      # Tarjeta individual con ICE, estado y acciones
    PriorityBadge.jsx # Chip Alta/Media/Baja según score (MUI Chip)
    ConfirmModal.jsx  # Dialog reutilizable de confirmación (MUI Dialog)
    Toast.jsx         # Snackbar + Alert auto-cierre error/success (MUI)
    ApiKeyModal.jsx   # Dialog para introducir/cambiar la API key de Gemini
  utils/
    ice.js            # Función calculateICE(impact, confidence, effort)
    gemini.js         # Función askGeminiForICE(title, description, apiKey)
    storage.js        # getTasks/saveTasks + getApiKey/saveApiKey
  App.jsx             # Estado global (tareas, modals, toast, apiKey) + handlers
  main.jsx
  theme.js            # Configuración del tema MUI (colores primarios, tipografía)
```

### 10.3 Funciones clave

```javascript
// utils/ice.js
export function calculateICE(impact, confidence, effort) {
  const safeEffort = effort < 1 ? 1 : effort;
  return Math.round((impact * confidence) / safeEffort);
}

// utils/storage.js
export const getTasks   = () => JSON.parse(localStorage.getItem('tasks') ?? '[]');
export const saveTasks  = (tasks) => localStorage.setItem('tasks', JSON.stringify(tasks));
export const getApiKey  = () => localStorage.getItem('gemini_api_key') ?? '';
export const saveApiKey = (key) => localStorage.setItem('gemini_api_key', key);

// utils/gemini.js  — recibe apiKey como parámetro, NO usa import.meta.env
export async function askGeminiForICE(title, description, apiKey) {
  const prompt = `...`; // ver §8.3
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text;
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error('JSON no encontrado en respuesta');
  const { impact, confidence, effort } = JSON.parse(match[0]);
  // validar rangos 1–10...
  return { impact, confidence, effort };
}

// App.jsx — estado de la API key (inicializado desde localStorage)
const [apiKey, setApiKey] = useState(() => getApiKey());
const [showApiKeyModal, setShowApiKeyModal] = useState(() => getApiKey() === '');
```

---

## 11. Flujos detallados

### F-0: Configurar API key (primer uso)
1. Al montar `App`, se ejecuta `getApiKey()`.
2. Si la key está vacía: `showApiKeyModal = true` → se renderiza `<ApiKeyModal>` sin opción de cerrar.
3. Usuario introduce su key y pulsa "Guardar": se ejecuta `saveApiKey(key)`, se actualiza `apiKey` en estado, se cierra el modal.
4. Si la key ya existe en `localStorage`: el modal no aparece y la app carga normalmente.
5. El botón "⚙ API Key" del header abre el modal con la key existente (con opción de "Cancelar").

### F-A: Añadir tarea
1. Usuario escribe título (obligatorio) y descripción (opcional).
2. Pulsa "Añadir tarea".
3. Se crea objeto con `id = Date.now()`, `state = 'esperando'`, `impact = confidence = effort = 5`, `iceScore = 5`, `aiCalculated = false`, `createdAt = Date.now()`.
4. Se añade al array de tareas, se guarda en `localStorage`, se limpia el formulario.
5. Toast de éxito: "Tarea añadida".
6. La lista se reordena (ICE 5, aparece según posición).

### F-B: Calcular ICE con IA
1. Usuario pulsa "✨ Calcular ICE" en una tarjeta.
2. Si la tarea ya tiene `aiCalculated = true`: se abre `<ConfirmModal>` de recálculo (ver §6.1); si cancela, fin.
3. Botón pasa a "Calculando…" y se deshabilita.
4. Se llama a `askGeminiForICE(title, description, apiKey)`.
5. **Éxito:** se actualiza `impact`, `confidence`, `effort`, se recalcula `iceScore`, se pone `aiCalculated = true`, se guarda en `localStorage`, se reordena la lista. Toast de éxito (ver §6.2).
6. **Error:** Toast de error (ver §6.2). Los valores no cambian.
7. Botón vuelve a "✨ Calcular ICE" y se habilita.

### F-C: Editar I/C/E manualmente
1. Usuario modifica cualquier input I, C o E (1–10).
2. En tiempo real (`onChange`): se recalcula `iceScore = calculateICE(i, c, e)`, se pone `aiCalculated = false`, se guarda en `localStorage`, la lista se reordena.
3. El badge de prioridad se actualiza en tiempo real. Sin toast (acción silenciosa).

### F-D: Cambiar estado
1. Usuario cambia el `<select>` de estado.
2. Si el nuevo estado es `'hecha'`: se abre `<ConfirmModal>` (ver §6.1); si cancela, el `<select>` vuelve al estado anterior.
3. Se actualiza el estado, se guarda en `localStorage`, la lista se reordena (las "hecha" van al final).

### F-E: Eliminar tarea
1. Usuario pulsa "🗑 Eliminar".
2. Se abre `<ConfirmModal>` de eliminación (ver §6.1); si cancela, fin.
3. Se elimina del array, se guarda en `localStorage`.

---

## 12. Fuera de alcance (lista cerrada)

- Backend, base de datos, API propia.
- Autenticación y cuentas de usuario.
- Filtros o búsqueda en la lista.
- Etiquetas / categorías / proyectos.
- Fechas límite, recordatorios o notificaciones.
- Paginación (sin límite de tareas en MVP; `localStorage` ≈ 5 MB).
- Sincronización entre dispositivos o navegadores.
- Tests automatizados.
- Animaciones complejas.
- PWA / modo offline explícito.

---

## 13. Criterios de "listo" (definition of done)

- [ ] Al abrir por primera vez (sin key en localStorage), aparece el `ApiKeyModal` y no se puede cerrar sin guardar una key.
- [ ] El botón "⚙ API Key" del header permite cambiar la key guardada.
- [ ] Crear, listar y eliminar tareas funciona con persistencia en `localStorage`.
- [ ] Los tres estados (Esperando / En curso / Hecha) se pueden asignar; marcar "hecha" abre `ConfirmModal`.
- [ ] "✨ Calcular ICE" llama a Gemini y actualiza I, C, E e ICE correctamente.
- [ ] El ICE se recalcula en tiempo real al editar I/C/E manualmente.
- [ ] La lista ordena: primero no-hecha por ICE desc, luego hecha por ICE desc.
- [ ] El badge Alta/Media/Baja refleja los rangos del §7.
- [ ] `ConfirmModal` aparece al eliminar, marcar como "hecha" y recalcular ICE con IA.
- [ ] Si la API falla, se muestra un Toast de error y los valores no se modifican.
- [ ] Todos los componentes de UI usan MUI. Sin CSS propio salvo ajustes puntuales en `theme.js`.
- [ ] No hay ninguna llamada a `window.alert()`, `window.confirm()` ni `window.prompt()` en el código.

---

## 14. Notas para el curso

| Concepto | Dónde se aplica |
|----------|-----------------|
| `useState` | Array de tareas, estado del formulario, loading del botón ICE, estado de modales y toast, apiKey |
| `useState` con función inicializadora | `useState(() => getApiKey())` — lazy init desde localStorage |
| `useEffect` | Leer tareas de `localStorage` al montar; guardar al cambiar tareas; auto-cierre del Toast |
| Props y callbacks | `TaskCard` recibe tarea y handlers desde `App`; `ConfirmModal` recibe `onConfirm` como prop |
| Renderizado condicional | `ApiKeyModal` si no hay key; `ConfirmModal` si `open = true`; badge de prioridad |
| Listas y `key` | `TaskList` renderiza `TaskCard` con `key={task.id}` |
| `fetch` + `async/await` | Llamada a Gemini en `gemini.js` |
| Manejo de errores async | `try/catch` en `askGeminiForICE`; Toast de error en el `catch` |
| Formularios controlados | `TaskForm` y `ApiKeyModal` con `value` y `onChange` |
| Material UI — entradas | `TextField`, `TextField select` (equivale a `<Select>` con label) |
| Material UI — feedback | `Snackbar` + `Alert` (Toast), botón con `disabled` durante carga |
| Material UI — diálogos | `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` |
| Material UI — layout | `AppBar`, `Toolbar`, `Box`, `Stack`, `Grid` |
| Material UI — datos | `Chip` (badge de prioridad y estado IA), `Card`, `CardContent` |
| localStorage como persistencia | Guardar tareas y API key; explicar límites y privacidad |

---

*Especificación MVP v2.2 – Gestor de Tareas ICE – Lista cerrada, lista para implementar.*
