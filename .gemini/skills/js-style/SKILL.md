---
name: programming style
description: Activated on demand to refactor code. This is a high-discipline, "contract-first" programming style that enforces atomic design, functional purity, and ultra-flat control flow through strict guard clauses, Yoda notation, and mandatory dependency injection to ensure deterministic and testable code.
---

0. **Contract Definition**: Write the JSDoc for the target function first to define the inputs, outputs, and dependencies before writing a single line of logic.
1. **Structural Authority & Atomic Design**:
   - Use named `function` declarations or `class` methods for all logic units.
   - **Single Responsibility (SRP)**: Each function must do exactly ONE thing (e.g., Validate, Transform, or Route).
   - **Physical Constraints**: Maximum 40 lines per function. If a function exceeds this, it must be decomposed.
   - **JSDoc Mandatory**: Every named function must include a JSDoc block with `@description`, `@param` (with types), and `@returns`.2. **Naming & Intent**:
   - All Boolean variables/predicates must use prefixes: `is`, `has`, `can`, or `should`.
2. **Yoda Notation**:
   - Place the constant/literal first in all comparisons (e.g., `if (null === data)`).
3. **Flat Control Flow (Mandatory)**:
   - ELIMINATE `else` and `else if`. Use early exits (Guard Clauses) only.
   - ELIMINATE `switch`. Use Object/Map literals for logical routing.
   - MAX 2 levels of nesting. Statements must remain distinct; avoid "mega-chains" of expressions.
4. **Variable Management**:
   - Default to `const`. Avoid `let` except for local iteration. ABSOLUTELY NO `var`.
   - Use Template Literals (``) exclusively for string concatenations.
5. **Architecture**:
   - **Dependency Injection**: Pass all external utilities (loggers, config, APIs) as arguments.
   - **Pure Functions**: Ensure core logic is deterministic and free of side effects.
6. **Error Handling**:
   - Replace "Sentinel Values" (`-1`, `null`) with explicit state objects.
   - Route errors by `error.constructor.name` through a handler Map.
7. **Syntax Polish**:
   - Omit `{}` ONLY for single-line guard clauses (e.g., `if (true === err) return null`).
   - Standard functions must retain braces for clarity.

# Methodology

- **Step 0: Atomic Breakdown**: Deconstruct the logic into named "Single Responsibility" steps.
- **Step 1: Contract Definition**: Write the JSDoc for each atomic unit first to define inputs and outputs.
- **Step 2: Audit**: Identify deep nesting, `else` branches, and anonymous arrow function abuse.
- **Step 3: Signature Design**: Define named functions that explicitly inject dependencies.
- **Step 4: Sentinel Guarding**: Clear all edge cases immediately using Yoda-style early exits.
- **Step 5: Mapping**: Implement a static Map/Object to replace procedural branching logic.
- **Step 6: Statement Refinement**: Ensure logic moves step-by-step in flat statements rather than a singular nested expression.

# Output Format

- **Architectural Change Log**: Bullet points of what was flattened and why.
- **The Refactored Implementation**: A single, clean, production-grade JavaScript block.
