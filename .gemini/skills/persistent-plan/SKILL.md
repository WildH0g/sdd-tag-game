---
name: persistent-plan
description: MANDATORY for any new feature, complex refactor, or multi-step task. Enforces the Stateful Planning Protocol by maintaining a progress file (either PROGRESS.md or DEBUG.md) in specs/<yyyy-mm-dd>_<feature_name>/. Trigger this IMMEDIATELY whenever a task is more complex than a single-file edit or involves multiple steps. You MUST use this skill to keep a stateful record of the project's execution.
---

# Persistent Plan (Stateful Planning Protocol)

You are the gatekeeper of the **Stateful Planning Protocol**. This protocol is designed to prevent "context drift" and ensure that every complex task has a clear, documented path to completion and a traceable history.

## Operational Mandates

1.  **Strict Location**: Every feature or significant task MUST have its own directory in `specs/<yyyy-mm-dd>_<feature_name>/`.
2.  **The Log**: Within that directory, you MUST maintain a progress file. This should be named `PROGRESS.md` for new feature development, or `DEBUG.md` for debugging tracks.
3.  **No Exceptions**: If a task involves more than 3 steps, touches multiple files, or involves architectural decisions, this protocol is active.
4.  **Update Cycle**: You MUST update the progress file after every significant step or phase completion.

## Progress File Template (PROGRESS.md / DEBUG.md)

Every progress file MUST follow this structure:

```markdown
# Project Progress: [Feature Name]

**Status:** [Not Started | In Progress | Complete]
**Start Date:** [YYYY-MM-DD]
**Context:** [Brief description of the task]

## 📋 Implementation Plan

### Phase 1: [Phase Name]

- [ ] **1.1 [Step Name]**
  - [Detailed sub-step]
  - **Agent Tools**: [Built-in tools, skills, MCP server tools and extensions that the agent must use, preferably more than two]
  - **Agent Skills:** [Specific skills the agent must activate for this step]
  - **Agent Verification:** [Specific unit tests, commands or actions to verify completion by the agent]
  - **User verification**: [QA scenarios that the user can run to test the changes manually]

### Phase 2: [Phase Name]

...

## 📝 Change Log

| Date       | Step | Status     | Notes                                                |
| :--------- | :--- | :--------- | :--------------------------------------------------- |
| YYYY-MM-DD | Init | 🟢 Started | [Actions taken, difficulties faced, lessons learned] |
```

## Workflow Execution

1.  **Initialization**:
    - Create the directory: `specs/<yyyy-mm-dd>_<feature_name>/`.
    - Write the initial progress file (`PROGRESS.md` or `DEBUG.md`) using the template.
    - Ask the user for approval of the plan before executing any logic.
2.  **Execution**:
    - For each step, perform the work and the **Agent Verification**.
    - Update the status in the progress file (e.g., change `[ ]` to `[x]`).
    - Add an entry to the **Change Log** table with a timestamp and notes.
3.  **Completion**:
    - Once all steps are finished, update the **Status** at the top to `Complete`.
    - Provide a final recap to the user referring to the log.
