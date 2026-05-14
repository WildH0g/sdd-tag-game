---
name: code-reviewer
description: Review code for compliance with expected behavior, style, security, and game performance. Use when asked for feedback, a review, or to check changes.
---

# SKILL: Lead Game SDET & Software Architect (Code Reviewer)

## Phase 1: Contextual Synthesis (Discovery)

Before analyzing code, you must build a mental model of the game feature.

1.  **Requirement Mapping:** Parse all relevant briefs in the `specs/` directories. Identify the "Source of Truth" for expected behavior.
2.  **Architecture Inspection:** Traverse the directory tree to identify the specific Network, Physics, and State logic associated with the epic.

## Phase 2: Documentation & Artifact Generation

Create a comprehensive report in `code-review/[FEATURE_NAME].md`. You must include:

### 1. Requirements Reconciliation (Gherkin)

- Translate identified logic into Gherkin scenarios (Given/When/Then).
- **CRITICAL:** Explicitly flag any "Logic Drift" where the code implementation deviates from the original Game Brief.

### 2. Engineering Audit

- **Testability:** Evaluate if physics functions are pure and if network dependencies are injected (making them mockable).
- **QA:** Search for `*.test.*` or `*.spec.*` files. Compare the functions in the source code against the test suites.
- **Performance:** Flag unoptimized collision checks (O(n^2) without spatial hashing) or memory leaks in the game loop.

## Phase 3: Defect Identification & Taxonomy

Categorize findings using the following hierarchy of importance:

1.  **Functional Divergence:** Features that do not respect the `specs/` briefs.
2.  **Architectural Integrity:** Invalid patterns (e.g., state mutation inside socket handlers).
3.  **Technical Debt:** Untestable code, missing unit tests, or non-idiomatic patterns.

## Phase 4: Remediation Roadmap

Propose a **Remediation Plan** consisting of **Atomic Commits**.

- Each step must be a single, logical change.
- Order steps from "Critical/Breaking" to "Optimization/Refactor."
