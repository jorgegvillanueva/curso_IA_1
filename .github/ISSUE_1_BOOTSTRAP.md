# Bootstrap del proyecto: Vite + React + TypeScript + estructura + linting

## Objetivo

Dejar la base del proyecto lista para implementar features: aplicación que arranca con React + TypeScript + Vite, estructura de carpetas definida en la arquitectura, y linting configurado.

## Alcance

- **Solo** lo siguiente (sin funcionalidad de negocio ni UI más allá de un layout mínimo):
  - Proyecto con **Vite + React + TypeScript**
  - Estructura de carpetas (`app`, `features`, `shared`) según arquitectura
  - **Material UI** instalado y tema configurado (`src/app/theme.ts`)
  - **ESLint** como herramienta de linting (`npm run lint`)
  - **EditorConfig** para consistencia entre editores
  - Layout mínimo que confirme que la app y el tema MUI arrancan correctamente

## Criterios de aceptación

- [ ] El proyecto **compila** sin errores (`npm run build` o `tsc --noEmit` correctos)
- [ ] **Lint correcto**: `npm run lint` termina sin errores
- [ ] **Sin dependencias extra** respecto al alcance: solo las necesarias para Vite, React, TS, MUI, ESLint y EditorConfig (sin librerías de estado, testing, etc.)

## Checklist de tareas

- [ ] Crear proyecto Vite con template React + TypeScript
- [ ] Instalar y configurar Material UI (tema en `src/app/theme.ts`)
- [ ] Crear estructura de carpetas (`app`, `features/*`, `shared/*`)
- [ ] Configurar ESLint y script `npm run lint`
- [ ] Añadir EditorConfig (`.editorconfig`)
- [ ] App arranca con layout mínimo y tema MUI aplicado
- [ ] Verificar compilación y lint sin errores

## Etiquetas

`bootstrap` `setup`
