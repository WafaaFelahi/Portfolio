# Feature Specification: Lunossa Portfolio

**Feature Branch**: `[lunossa-portfolio-v1]`

**Created**: 2026-08-15

**Status**: Approved

**Input**: User description: "Build a single-page scroll-driven personal portfolio called Lunossa for Wafa Felahi. It is a poetic visual journey inspired by moon and lotus imagery."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Hero Experience (Priority: P1)

A visitor lands on the site and is immediately immersed in the dark, ethereal aesthetic, understanding Wafa's core value proposition.

**Why this priority**: First impressions are critical for a portfolio.
**Independent Test**: Can be tested by loading the site and verifying the presence of the 3D Moon canvas, animated veil, and correct introduction text.

**Acceptance Scenarios**:
1. **Given** a new visitor, **When** they load the page, **Then** they see the "Wafa Felahi" heading and a rotating 3D moon in the background.

---

### User Story 2 - Honest Project Showcase (Priority: P1)

A visitor wants to see real evidence of Wafa's skills in cloud infrastructure and full-stack development without exaggerated claims.

**Why this priority**: Real substance proves the skills listed in the resume.
**Independent Test**: Can be tested by scrolling to the Projects section and verifying the presence of "KeepBeat" and "AWS Microservices" with their respective GitHub links.

**Acceptance Scenarios**:
1. **Given** a visitor scrolling to the Projects section, **When** they view the cards, **Then** they see accurate descriptions and tech stacks for each project.
2. **Given** a visitor interacting with a project card, **When** they click the GitHub link, **Then** they are taken to the correct repository.

---

### User Story 3 - Skills Discovery (The Bloom) (Priority: P2)

A visitor wants to understand Wafa's specific technical skills in a visually engaging way.

**Why this priority**: Demonstrates technical breadth while maintaining the aesthetic narrative.
**Independent Test**: Can be tested by interacting with the lotus petals and verifying the correct skill details are displayed.

**Acceptance Scenarios**:
1. **Given** a visitor in the Bloom section, **When** they click a lotus petal, **Then** the corresponding skill details (e.g., Cloud & DevOps) appear in the centre panel.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a 3D animated scene using React Three Fiber.
- **FR-002**: System MUST implement a scroll-driven navigation with intersection observers.
- **FR-003**: System MUST display 6 distinct sections: Hero, Path, Bloom, Projects, Infinity, Contact.
- **FR-004**: System MUST ensure all animations respect `prefers-reduced-motion` for accessibility.
- **FR-005**: System MUST include a working `mailto:` link in the contact form.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Page loads and becomes interactive (including 3D elements) in under 3 seconds on a standard broadband connection.
- **SC-002**: No console errors are present in the production build.
- **SC-003**: The site is fully responsive on mobile, tablet, and desktop viewports.

## Assumptions

- Visitors have WebGL-compatible browsers to view the 3D moon scene.
- The `mailto:` contact form is sufficient for v1; no backend API is required for form submission at this stage.
