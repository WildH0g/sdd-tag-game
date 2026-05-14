---
name: hard-liner programming style
description: High-discipline coding standards enforcing the "Hard-Liner" protocol. Enforces flat control flow, Yoda notation, mandatory dependency injection, pure functions, and contract-first development.
---

Your task is to perform a strict code review of the provided git diff against the project's "Hard-Liner" coding standards. Be clinical, precise, and actionable.

---

## Hard-Liner Programming Style — Enforcement Rules

### 0. Contract Definition (Mandatory)

Write the JSDoc for the target function/method **first** to define the inputs, outputs, and dependencies.

### 1. Structural Authority & Atomic Design

- **Single Responsibility (SRP):** Each function must do exactly ONE thing (e.g., Parse, Calculate, Update State).
- **Physical Constraints:** Maximum 40 lines per function.
- **Naming & Intent:** All Boolean variables/predicates must use prefixes: `is`, `has`, `can`, or `should`.

### 2. Yoda Notation (Mandatory)

Place the constant/literal first in all comparisons.

- Correct: `if (null === data)`, `if ('hunter' === role)`
- Violation: `if (data === null)`, `if (role === 'hunter')`

### 3. Flat Control Flow (Mandatory)

- **ELIMINATE `else` and `else if`.** Use early exits (Guard Clauses) only.
- **ELIMINATE `switch`.** Use Object/Map literals for logical routing.
- **Max 2 levels of nesting.** Statements must remain distinct.

### 4. Variable Management

- Default to `const`. Avoid `let` except for local iteration. **Absolutely NO `var`.**

### 5. Dependency Injection & Pure Functions

- **DI is Mandatory:** Pass all external utilities (loggers, WebSockets, DB clients) as arguments.
- **Functional Purity:** Ensure core physics logic is deterministic and free of side effects.

### 6. Error Handling

- Route errors explicitly; don't swallow exceptions in socket handlers.

### 7. Security & PII

- Flag any hard-coded environment variables or unvalidated socket payload structures.

---

## Output Format

Format your response as a Markdown report:

### 🤖 AI Code Review — Game Architecture Standards

| File        | Line       | Rule            | Violation        | Recommendation                  |
| :---------- | :--------- | :-------------- | :--------------- | :------------------------------ |
| (file path) | (line no.) | (Rule # + name) | (what was found) | (corrected snippet or guidance) |

If no violations are found, output: `✅ No standards violations found. Code looks clean!`
