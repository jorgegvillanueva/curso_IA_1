# Revisión de arquitectura: MVP Gestor de Tareas ICE

**Documento de referencia:** `mvp_gestor_tareas_ice.md`  
**Rol:** Arquitecto senior  
**Fecha:** 24 de febrero de 2026  

---

## 1. Ambigüedades detectadas

### 1.1 Modelo ICE: Esfuerzo vs Ease

| En la spec | Problema |
|------------|----------|
| Campos: `impacto`, `confianza`, **esfuerzo** (1-10) | En el framework ICE clásico el tercer factor es **Ease** (facilidad), no esfuerzo. |

- Si **esfuerzo** = “cantidad de trabajo”: 10 = mucho esfuerzo → la fórmula `(I*C)/E` hace que más esfuerzo baje el score (correcto para priorizar “lo más fácil de alto impacto”).
- Si **esfuerzo** = “facilidad” (como Ease): 10 = muy fácil → entonces la fórmula debería ser `I*C*E` para que más facilidad suba el score.

**Recomendación:** Definir explícitamente en la spec: “Esfuerzo: 1 = poco esfuerzo / muy fácil, 10 = mucho esfuerzo / muy difícil” y confirmar que la fórmula es `(I*C)/Esfuerzo` (así 10 en esfuerzo = difícil = menor score). O renombrar a “facilidad” e invertir escala para evitar confusiones en el curso.

---

### 1.2 Etiquetas

| En la spec | Problema |
|------------|----------|
| “Crear tarea con… **etiquetas (opcional)**” | No se define tipo, cardinalidad ni uso. |

- ¿Una etiqueta o varias por tarea?
- ¿Valores libres (input texto) o lista predefinida?
- ¿Se usan para filtrar la lista? Si sí, hay que especificarlo (y suma alcance).

**Recomendación:** Para MVP de curso: o bien quitar etiquetas, o definir “un único campo opcional: categoría (texto libre)” sin filtro por categoría. Si se mantienen “etiquetas”, definir: tipo (array de strings), sin filtro en MVP.

---

### 1.3 Prioridad visual (alta, media, baja)

| En la spec | Problema |
|------------|----------|
| “Indicador visual de prioridad (alta, media, baja) **según rangos definidos**” | Los rangos no están definidos. |

- No se dice qué intervalo de puntaje ICE corresponde a “alta”, “media” o “baja”.
- Depende de si la fórmula es `(I*C)/E` (típicamente scores altos) o media (1–10).

**Recomendación:** Incluir en la spec una tabla, por ejemplo:  
- Alta: ICE ≥ X  
- Media: Y ≤ ICE < X  
- Baja: ICE < Y  
(con X, Y concretos según la fórmula elegida).

---

### 1.4 Ordenamiento: ICE y fecha

| En la spec | Problema |
|------------|----------|
| “Ordenar tareas por puntaje ICE (descendente) **y por fecha de creación**” | No se define criterio primario/secundario. |

- ¿Primero por ICE y, en empate, por fecha? ¿O al revés?
- La “fecha de creación” no aparece en el modelo de datos (solo título, descripción, etiquetas). No se dice si se genera automáticamente ni en qué formato (ISO, timestamp, etc.).

**Recomendación:** Definir: (1) cada tarea tiene `createdAt` (timestamp o ISO string), (2) orden por defecto: primero por ICE descendente, en empate por `createdAt` descendente (más reciente primero). Dejarlo escrito en la spec.

---

### 1.5 Contrato de la API de IA

| En la spec | Problema |
|------------|----------|
| “Responder en **JSON estricto**” / “{impacto, confianza, esfuerzo}” | Los LLMs no garantizan JSON estricto; suelen devolver texto con markdown o explicaciones. |

- No se describe cómo obtener los tres números si la respuesta incluye texto alrededor.
- No se indica qué hacer si faltan claves, hay claves en inglés (`impact`, `confidence`, `ease`) o el parseo falla.

**Recomendación:** Especificar: (1) estrategia de parseo (ej. extraer primer objeto JSON del body con regex o intentar `JSON.parse` y fallback), (2) aceptar tanto `impacto` como `impact` (y análogo para confianza y esfuerzo/ease), (3) valores por defecto si falla (ej. 5, 5, 5) y mostrar mensaje “Valores por defecto; revisar manualmente”.

---

### 1.6 Estado de carga y errores

| En la spec | Problema |
|------------|----------|
| “Estado de carga mientras se calcula ICE” | No se acota. |

- ¿Solo durante la llamada a la API o también al leer `localStorage` al montar?
- ¿Timeout si la API no responde? ¿Reintentos?
- “Mensajes de error si la API falla”: no se dice si el botón “Calcular ICE” se deshabilita, si se permite reintento o edición manual.

**Recomendación:** Dejar explícito: estado de carga solo durante la petición a la API; sin timeout/reintentos en MVP; en error se muestra mensaje y se habilita edición manual de ICE (ya contemplado en la spec).

---

## 2. Riesgos

### 2.1 API key en frontend (sin backend)

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| La API key va en `.env` (ej. `VITE_*`) y se incluye en el bundle; cualquiera puede verla y usarla. | Alto (abuso, facturación, revocación de key). | Documentar en el curso que es **solo para desarrollo/curso**; en producción hace falta un backend que llame a la API. Opcional: backend mínimo (proxy) en el curso para no exponer la key. |

---

### 2.2 CORS y APIs “gratuitas”

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| La spec pide “Permitir CORS desde el navegador”. Muchas APIs de IA (OpenAI, etc.) no permiten CORS desde origen arbitrario; el frontend no puede llamarlas directo. | Alto (el flujo “sin backend” no funciona con esas APIs). | Verificar **antes** del curso un proveedor que permita CORS o usar un proxy público de confianza. Opciones típicas: Groq (revisar doc actual), Hugging Face Inference, o un proxy docente. Incluir en la spec: “Proveedor verificado: [nombre]” y enlace a doc CORS. |

---

### 2.3 Robustez del parseo de la IA

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| La IA devuelve texto libre; el JSON puede venir con claves en inglés, comentarios o texto alrededor. Parseo frágil rompe la UX. | Medio. | Definir en spec: normalización de claves (impacto/impact, etc.), extracción del primer JSON válido, validación de rangos 1–10, y fallback a valores por defecto + mensaje. Incluir en el curso un ejemplo de “respuesta real” y cómo parsearla. |

---

### 2.4 Fórmula ICE: división por cero

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| Fórmula `(I*C)/E`. Si **E = 0** (por error de la IA o entrada manual), división por cero. | Medio (error en runtime). | Especificar: E nunca puede ser 0 en la fórmula; si E = 0, tratar como E = 1 o no calcular ICE y mostrar “Ajustar esfuerzo”. Implementar en código: `const safeE = E === 0 ? 1 : E`. |

---

### 2.5 Límite de localStorage

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| `localStorage` tiene límite (~5 MB por origen). Muchas tareas con descripciones largas podrían llenarlo. | Bajo en curso típico. | No obligatorio en MVP; mencionar en “Limitaciones” que la persistencia está limitada por el navegador y que no hay gestión de cuota. Opcional: aviso si `localStorage.setItem` falla. |

---

### 2.6 Límites de rate en APIs gratuitas

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| Free tier con límite de solicitudes/minuto; el usuario puede pulsar “Calcular ICE” muchas veces y recibir 429. | Medio (mala experiencia). | Especificar: en respuesta 429 (o error de rate limit) mostrar mensaje claro (“Demasiadas peticiones; espera un momento”) y deshabilitar el botón unos segundos. No hace falta lógica compleja en el MVP. |

---

## 3. Exceso de alcance para un MVP de curso

Objetivo declarado: “MVP simple” y “orientado a aprendizaje”. Los siguientes puntos aumentan complejidad sin ser estrictamente necesarios para el núcleo (CRUD + ICE con IA).

| Elemento en la spec | Motivo de exceso | Recomendación |
|--------------------|------------------|---------------|
| **Etiquetas** | Implica modelo de datos más complejo, UI para añadir/quitar/editar y, si hay filtro, más estado y lógica. | Quitar en MVP o reducir a un solo campo “categoría” opcional (texto libre) sin filtro. |
| **Filtros (Todas / Pendientes / Completadas)** | Tres estados y persistencia del filtro activo; más estado y condicionales en la lista. | Aceptable si se implementa como un único `filter` (todas | pendientes | completadas) sin persistir el filtro; mejor aún: solo “Todas” y “Ocultar completadas” (un booleano) para reducir casos. |
| **Indicador visual de prioridad (alta/media/baja)** | Requiere definir rangos, mapear ICE → etiqueta y más estilos/componentes. | Opcional para MVP: dejar solo el valor numérico ICE; si se mantiene, definir rangos en la spec (ver 1.3). |
| **Orden por fecha de creación además de por ICE** | Dos criterios de orden (y posible selector de orden) aumentan la lógica. | Para MVP: ordenar solo por ICE descendente; en empate, orden estable (ej. por id o por createdAt si ya existe). No exponer en UI “ordenar por fecha” en la primera versión. |
| **Dos decimales en el puntaje ICE** | Detalle menor; solo asegurar que la spec diga “mostrar con 2 decimales” y que el cálculo use tipo numérico (no string). | Mantener; es claro y fácil de implementar. |

---

## 4. Resumen ejecutivo

| Categoría | Cantidad | Acción prioritaria |
|-----------|----------|--------------------|
| **Ambigüedades** | 6 | Aclarar fórmula ICE (esfuerzo vs Ease), definir rangos de prioridad, modelo de datos (createdAt, etiquetas), contrato y parseo de la API. |
| **Riesgos** | 6 | Documentar uso de API key solo en desarrollo; verificar CORS del proveedor; robustecer parseo y manejo de E=0 y 429. |
| **Exceso de alcance** | 4–5 ítems | Simplificar etiquetas, filtros y ordenamiento para mantener el MVP en “desarrollo simple” y alineado al curso. |

**Recomendación final:** Actualizar `mvp_gestor_tareas_ice.md` resolviendo las ambigüedades de la sección 1, añadiendo las mitigaciones de la sección 2 y recortando opcionalmente los elementos de la sección 3. Con eso la spec queda lista para implementación y para usar como material del curso de React sin sorpresas técnicas ni de alcance.
