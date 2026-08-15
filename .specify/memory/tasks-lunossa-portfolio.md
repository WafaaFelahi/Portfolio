# Task Breakdown: Lunossa Portfolio

**Feature Branch**: `[lunossa-portfolio-v1]`

**Created**: 2026-08-15

## Task List *(mandatory)*

### Phase 1: Foundation & Data
- [x] **TSK-001**: Initialise React + Vite + TypeScript project.
- [x] **TSK-002**: Install Tailwind CSS v4, Framer Motion, and Three.js dependencies.
- [x] **TSK-003**: Create `index.css` defining the custom design tokens (colors, fonts, glassmorphism).
- [x] **TSK-004**: Create `data.ts` to hold all real project data, skills, and profile info sourced from CV/GitHub.

### Phase 2: Core UI Components
- [x] **TSK-005**: Implement `App.tsx` shell with star field backdrop and semantic sections.
- [x] **TSK-006**: Implement `Nav.tsx` with fixed side dots and scrollspy functionality.
- [x] **TSK-007**: Implement `Hero.tsx` with introduction text and animated veil.

### Phase 3: The 3D & Interactive Elements
- [x] **TSK-008**: Implement `MoonScene.tsx` using `@react-three/fiber` for the distorted moon sphere.
- [x] **TSK-009**: Implement `TheBloom.tsx` with the interactive lotus petal layout for skills.
- [x] **TSK-010**: Implement `Infinity.tsx` with the Canvas 2D lemniscate loop animation.

### Phase 4: Content Sections
- [x] **TSK-011**: Implement `ThePath.tsx` for the timeline history.
- [x] **TSK-012**: Implement `Projects.tsx` for displaying the flagship, major, and hackathon projects.
- [x] **TSK-013**: Implement `Contact.tsx` with the `mailto:` form and social links.

### Phase 5: Polish & Deployment
- [x] **TSK-014**: Fix TypeScript and import errors across components.
- [ ] **TSK-015**: Run local development server and manually verify responsiveness.
- [ ] **TSK-016**: Optimise 3D canvas performance for mobile devices.
- [ ] **TSK-017**: Build the production bundle and prepare for deployment.

## Future Enhancements
- Add a custom WebGL shader for the veil effect instead of SVGs.
- Implement a backend service for contact form submission to replace the `mailto:` link.
