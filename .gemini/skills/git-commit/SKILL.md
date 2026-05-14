---
name: git commit
description: Activate on instruction to "commit" or "git commit". Generates atomic, logically-grouped git commits with a pre-execution approval plan following the Conventional Commits v2.0.0 specification.
---

# GOAL

Your goal is to transform a raw 'git diff' into a series of clean, atomic, and professional commit commands.

# CONTEXT

The user is working in a high-stakes environment. You must provide a "Commit Plan" for approval before the user executes the final command string.

# OBJECTIVE

1. Analyze the diff and partition changes into logical, atomic groups.
2. Present a summary "Commit Plan."
3. Generate a single, executable shell string using `&&` and `\` for clean formatting.

# RULES & CONSTRAINTS

- **Atomicity:** One logical change = One commit. Separate features, fixes, and refactors.
- **Syntax:** Follow the Conventional Commits v1.0.0 specification exactly.
- **Format:**
  - Subject (description): Max 50 chars, imperative mood.
  - Body: Required for complex logic; wrap at 72 chars.
  - Footer: One blank line after the body. Used for BREAKING CHANGE or issue tracking.
- **Shell Syntax:** Chain all commands with `&&` and use `\` for line breaks to ensure readability and "all-or-nothing" execution.

# CONVENTIONAL COMMITS v1.0.0 STRUCTURE

`<type>[optional scope]: <description>`

`[optional body]`

`[optional footer(s)]`

1.  **Type:** Commits MUST be prefixed with a type (e.g., `feat`, `fix`).
    - `feat`: Introduces a new feature to the codebase (correlates with MINOR in Semantic Versioning).
    - `fix`: Patches a bug in your codebase (correlates with PATCH in Semantic Versioning).
    - Other types MAY be used, such as `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`, `revert`.
2.  **Scope (Optional):** A scope MAY be provided after a type. A scope must consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., `fix(parser):`.
3.  **Breaking Changes:**
    - MUST be indicated by either a `!` immediately before the `:` in the type/scope prefix (e.g., `feat(api)!: send an email to the customer when a product is shipped`).
    - Or as a footer starting with the uppercase text `BREAKING CHANGE: ` followed by a description.
4.  **Description:** A short and concise summary of the changes. MUST immediately follow the colon and space after the type/scope prefix. Use imperative mood (e.g., "add", not "added" or "adds"). Do not capitalize the first letter and do not end in punctuation.
5.  **Body (Optional):** A longer description explaining the 'what' and 'why'. MUST begin one blank line after the description. Is free-form and MAY consist of any number of newline separated paragraphs.
6.  **Footer (Optional):** One or more footers MAY be provided one blank line after the body. Each footer MUST consist of a word token, followed by either a `:<space>` or `<space>#` separator, followed by a string value (e.g., `Refs: #123`).

# METHODOLOGY (Chain of Thought)

1. **Analyze:** Scan the diff to identify distinct logical domains.
2. **Plan:** Create a bulleted "Commit Plan" showing which files go into which commit.
3. **Construct:** Draft the `git commit` commands.
4. **Finalize:** Join the commands into a single block using `&& \`.

# OUTPUT FORMAT

Your response must follow this exact structure:

### 📋 Commit Plan

- `[type]([scope]): [description]` (Files: [file1, file2])
- `[type]: [description]` (Files: [file3])

### 🚀 Execution Command

```bash
git add [files_for_1] && \
git commit -m "[type]([scope]): [description]" -m "[body]" -m "[other footers if any]" && \
git add [files_for_2] && \
git commit -m "[type]: [description]"
```

T

Your response must follow this exact structure:

### 📋 Commit Plan

- `[type]([scope]): [description]` (Files: [file1, file2])
- `[type]: [description]` (Files: [file3])

### 🚀 Execution Command

```bash
git add [files_for_1] && \
git commit -m "[type]([scope]): [description]" -m "[body]" -m "[footer]" && \
git add [files_for_2] && \
git commit -m "[type]: [description]"
```
