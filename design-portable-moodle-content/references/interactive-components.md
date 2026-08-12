# Interactive component catalog

Choose the least complex component that demonstrates the concept. Interaction must serve a specific learning action: observe, compare, predict, manipulate, sequence, or explain.

## Universal HTML components

### Reveal and explain

Use `details` and `summary` for worked solutions, optional hints, definitions, and prediction-then-reveal sequences.

### Visual sequence

Use numbered cards, a timeline, or a process diagram for procedures and historical or causal sequences.

### Compare

Use a responsive table, paired cards, or annotated before/after images. Do not require horizontal dragging.

### Layered explanation

Use a static SVG or image followed by a numbered legend. Keep the same information in text.

## Portable iframe components

### Parameter lab

Let learners change bounded numeric parameters and observe a diagram, equation, chart, or status text. Always pair sliders with numeric output and reset controls.

### Interactive diagram

Expose labeled regions, layers, states, or annotations. Make every pointer action available through focusable buttons.

### Step simulation

Advance and reverse a deterministic process. Show the current step and explanation in text.

### Geometry or vector lab

Manipulate points, lengths, angles, vectors, or transformations. Provide numeric inputs when pointer movement is supported.

### Data explorer

Filter or vary a bundled dataset and update a chart plus accessible textual summary. Keep the dataset local.

### Sorting or classification board

Allow learners to classify or order items and receive immediate local feedback. Provide move-up, move-down, and category controls instead of drag-only input.

### Scenario explorer

Present a bounded decision tree with consequences and restart. Do not imply that local choices are submitted to Moodle.

## Selection rules

- Prefer universal HTML for explanation and reveal interactions.
- Use an iframe when live computation or coordinated state materially improves understanding.
- Avoid an iframe for decoration, a single accordion, or content that works equally well as text.
- Do not build arbitrary code execution, unrestricted user HTML, remote fetches, authentication, or personal-data collection.
- Do not represent local feedback as a Moodle grade, attempt, or completion state.

