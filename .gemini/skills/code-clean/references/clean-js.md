# Clean Code JavaScript: Standard Authority

This document defines the clinical standards for clean, maintainable, and testable JavaScript code, based on industry best practices and the `clean-code-javascript` standard.

## 🏷️ 1. Variables & Naming

- **Meaningful & Searchable**: Names must reveal intent. Avoid `data`, `info`, or `item` in large scopes.
- **Pronounceable**: Use `customerRegistrationDate` instead of `cregDate`.
- **Vocabulary Consistency**: Use one word per concept. Don't mix `get`, `fetch`, and `retrieve` for the same action type.
- **Explanatory Variables**: Break complex logic into named pieces.
- **No Unneeded Context**: If a class is `User`, don't name the property `userName`. Use `name`.

```javascript
// ✅ GOOD: Explanatory variables
const [_, city, zipCode] = address.match(cityZipCodeRegex) || [];
saveCityZipCode(city, zipCode);
```

## ⚙️ 2. Functions

- **Small & Focused**: A function should do exactly ONE thing (SRP).
- **Argument Count**: Ideally 0-2. Use an **Object** for 3+ arguments to allow named parameters and destructuring.
- **No Boolean Flags**: If a function has a `shouldX` flag, it does two things. Split it into two functions.
- **Avoid Side Effects**: Favor immutability. Return new objects/arrays instead of mutating inputs.
- **Level of Abstraction**: Maintain a single level of abstraction per function.

```javascript
// ✅ GOOD: Immutability
const addItemToCart = (cart, item) => [...cart, { item, date: Date.now() }];
```

## 🏗️ 3. Objects & Classes

- **Encapsulation**: Use getters/setters for property access to allow for validation/logging logic later without breaking the API.
- **Composition over Inheritance**: Favor components and shared utilities over deep class hierarchies.
- **Method Chaining**: Return `this` for fluent, expressive APIs.

## 🛡️ 4. SOLID in Vanilla JS / Node.js Game Server

- **SRP**: Isolate game logic (physics, state) from network handlers (WebSocket callbacks).
- **OCP**: Use **Strategy Pattern** (Object Maps) for different message types or player roles to make code open for extension.
- **LSP**: Ensure player state objects adhere to a strict interface, regardless of their role.
- **ISP**: Pass only the specific data needed to systems. Don't pass the entire socket object to the physics engine.
- **DIP**: Core game logic must depend on generic arguments/interfaces, not on concrete `ws` Server instances or specific DB singletons.

## ⚠️ 5. Error Handling & Concurrency

- **Don't Swallow Errors**: Never use an empty `catch` block.
- **Standardized Rejections**: Always reject Promises with `Error` objects, not strings.
- **Async/Await**: Mandatory for asynchronous flows to prevent "Promise Hell."

## 🚩 Audit Checklist

- [ ] Are variables pronounceable and searchable?
- [ ] Does every function handle exactly one responsibility?
- [ ] Are there functions with >3 positional arguments? (Refactor to object).
- [ ] Is input being mutated instead of cloned?
- [ ] Are there large `if/else` or `switch` blocks that could be a Strategy Map?
- [ ] Are errors being caught and handled or re-thrown properly?
