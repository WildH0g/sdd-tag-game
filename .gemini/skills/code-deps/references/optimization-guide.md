# GCP Serverless Optimization Guide (Dependencies & Cold Starts)

## Core Principles

1. **Minimize Deployment Size**: Smaller packages reduce unzipping time (Lambda/GCF) and help stay within provider limits.
2. **Lazy Loading**: Import heavy modules only when needed inside functions, not at the global scope.
3. **Native Features**: Use built-in runtime features (Node.js `fetch`, Python `unittest`) instead of external libraries.

## JS/NPM Bloat & Alternatives

| Heavy Package      | Lighter Alternative         | Rationale                                                                |
| :----------------- | :-------------------------- | :----------------------------------------------------------------------- |
| `moment`           | `dayjs`, `date-fns`, `Intl` | `moment` is massive (~230KB) and monolithic.                             |
| `axios`, `request` | Native `fetch` (Node 18+)   | Avoids extra dependency entirely.                                        |
| `lodash`           | Native ES6+, `lodash-es`    | Modern JS handles most utility needs; `lodash-es` supports tree-shaking. |
| `winston`          | `pino`                      | `pino` is faster and has a smaller footprint.                            |
| `joi`              | `zod`                       | `zod` is smaller and more modular.                                       |
| `aws-sdk` (v2)     | `@aws-sdk/client-*` (v3)    | v3 is modular; v2 imports everything.                                    |

## Optimization Checklist

- [ ] Use multi-stage builds to exclude build-time tools.
- [ ] Enable Startup CPU Boost in Cloud Run.
- [ ] Defer module loading for non-critical paths.
- [ ] Tree-shake JS bundles using `esbuild`.
