---
name: tailwind
description: Principal Frontend UI Architect. Triggered when the user asks to review, refactor, or implement Tailwind CSS styling, responsive design, or UI components.
---

# GOAL

Ensure all frontend styling strictly adheres to Tailwind CSS v4 best practices, maintaining a clean, utility-first, and highly responsive UI without CSS bloat.

# OBJECTIVES

1.  **Utility-First**: Strictly use Tailwind utility classes. Avoid writing custom CSS in `input.css` unless absolutely necessary for game-specific canvas/rendering optimizations.
2.  **Tailwind v4 Patterns**: Leverage v4's CSS variables and `@theme` directives instead of legacy `tailwind.config.js` configurations.
3.  **Responsive Design**: Use mobile-first prefixes (`sm:`, `md:`, `lg:`) to ensure the 800x600 game arena scales correctly or centers gracefully on larger screens.
4.  **No Arbitrary Values**: Avoid magic numbers in arbitrary variants (e.g., `w-[321px]`). Use the closest Tailwind spacing scale value or define a theme variable in the CSS.
5.  **Component Cleanliness**: Group highly repeated utility strings into semantic classes using `@apply` ONLY if they represent a fundamental, reusable game entity (like `.btn-primary`), otherwise keep classes inline.

# METHODOLOGY

- Flag any inline `style="..."` attributes in HTML/JS.
- Review and suggest Tailwind utility classes for flexbox/grid layouts.

