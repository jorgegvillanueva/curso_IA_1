# Git flow: main y dev

Este proyecto usa un flujo con dos ramas principales:

- **main**: rama de producción; debe estar estable y protegida.
- **dev**: rama de integración; aquí se fusionan las issues/features mediante Pull Requests.

## Ramas creadas

- `main` — rama por defecto, historial estable.
- `dev` — rama de desarrollo; las issues se trabajan en ramas tipo `feature/xxx` o `fix/xxx` y se abren PRs contra **dev**.

## Configuración en el remoto (GitHub / GitLab)

La protección de `main` y que los PRs apunten a `dev` se configuran en la plataforma, no en el repo.

### GitHub

1. **Repositorio → Settings → General**
   - En "Default branch" puedes dejar `main` (es la rama que se clona por defecto; no afecta el base de los PRs).

2. **Repositorio → Settings → Branches → Branch protection rules**
   - Add rule.
   - **Branch name pattern:** `main`
   - Activar, según quieras:
     - **Require a pull request before merging**
     - **Require approvals** (ej. 1)
     - **Do not allow bypassing the above settings** (incl. admins)
   - Save.

3. **Que los PRs de las issues apunten a dev**
   - Al crear una rama desde una issue, GitHub suele tomar la rama por defecto como base.
   - Para que la base sea siempre `dev`:
     - **Settings → General → Pull Requests**: no hay opción global "default base branch for PRs".
     - Opción práctica: al crear el PR, elegir **base: dev** en el desplegable.
     - O usar una **pull request template** (`.github/PULL_REQUEST_TEMPLATE.md`) que recuerde: "Base: dev".
   - Alternativa: en **Settings → General** cambia temporalmente la "Default branch" a `dev`; entonces los nuevos PRs se abrirán por defecto contra `dev`. (La default branch sigue siendo la rama "principal" del repo; si quieres que sea `main` para clones, vuelve a poner `main` y recuerda elegir base `dev` al abrir PRs.)

### GitLab

1. **Settings → Repository → Protected branches**
   - Proteger `main`: Allowed to merge: Maintainers (o Roles); Allowed to push: No one; Allowed to force push: No.

2. **Que los PRs (Merge requests) apunten a dev**
   - **Settings → Merge requests**: en "Default target project" no aplica si es un solo repo.
   - Al crear Merge Request, elegir **Target branch: dev**.
   - Opcional: en **Settings → Merge requests** activar "Default description template" y mencionar que el target debe ser `dev`.

## Flujo de trabajo recomendado

1. Crear rama desde `dev` para cada issue:  
   `git checkout dev && git pull && git checkout -b feature/ISSUE-123-descripcion`
2. Hacer commits y subir:  
   `git push -u origin feature/ISSUE-123-descripcion`
3. Abrir Pull/Merge Request con **base branch = dev** (no main).
4. Tras revisión, fusionar en `dev`.
5. Cuando `dev` esté estable, fusionar `dev` → `main` (por PR o directo si tienes permiso y no está bloqueado).

## Resumen

| Qué                         | Dónde se hace                          |
|----------------------------|----------------------------------------|
| Ramas `main` y `dev`       | Ya creadas en el repo local            |
| Proteger `main`            | GitHub/GitLab: branch protection       |
| PRs de issues contra `dev` | Al abrir el PR, elegir base = `dev`   |
