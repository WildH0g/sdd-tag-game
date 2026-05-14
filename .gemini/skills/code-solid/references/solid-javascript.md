# SOLID Principles in JavaScript: Standard Authority

This document defines the clinical standards for SOLID implementation in JavaScript and TypeScript codebases.

## 1. Single Responsibility Principle (SRP)

_"A function or class should do exactly one thing."_

### 🚩 Violations

- **The "God Component"**: A React component handling data fetching, state management, and complex rendering.
- **Swiss Army Functions**: Functions with 10+ arguments or large `switch` blocks handling unrelated logic.

### ✅ Gold Standard (Functional Pattern)

```javascript
// ✅ GOOD: Composed pure functions
const validate = (data) => ({ ...data, isValid: !!data.email });
const save = (data) => {
  /* db logic */ return data;
};
const respond = (data) => ({ status: 200, body: data });

const registerUser = (req) => respond(save(validate(req.body)));
```

---

## 2. Open/Closed Principle (OCP)

_"Entities should be open for extension, but closed for modification."_

### ✅ Gold Standard

Use the **Strategy Pattern** with an **Object Map** or `Map` to replace `if/else` or `switch` chains.

```javascript
const formatters = {
  json: (data) => JSON.stringify(data),
  csv: (data) => data.join(','),
  xml: (data) => `<data>${data}</data>`,
};

// Logic is CLOSED to modification when adding new formats
function exportData(data, type) {
  const formatter = formatters[type];
  if (!formatter) throw new Error('Unsupported type');
  return formatter(data);
}
```

---

## 3. Liskov Substitution Principle (LSP)

_"Subclasses/Subtypes must be replaceable by their base types."_

### 🚩 Violations

- **Breaking the Contract**: A wrapper component that suppresses standard events (e.g., ignoring `onClick` but accepting it as a prop).

### ✅ Gold Standard

Maintain behavioral consistency. In TypeScript, ensure subtypes strictly implement the interface of the base type.

---

## 4. Interface Segregation Principle (ISP)

_"Clients should not be forced to depend on data or methods they do not use."_

### 🚩 Violations

- **"Fat Props"**: Passing a massive domain object to a small Atomic component that only needs one or two specific fields.

### ✅ Gold Standard

Pass only the specific data required. Use **Composition** over large "Config" objects.

```javascript
// ❌ BAD: Fat dependency
const updateSettings = (user) => {
  db.save(user.id, user.settings);
};

// ✅ GOOD: Focused dependency
const updateSettings = (userId, settings) => {
  db.save(userId, settings);
};
```

---

## 5. Dependency Inversion Principle (DIP)

_"Depend on abstractions, not concretions."_

### ✅ Gold Standard

Use **Dependency Injection** (Constructor Injection) or **Function Arguments**.

```javascript
// ✅ GOOD: Dependency is passed in, not hardcoded
const createAuthService = (dbClient) => ({
  login: (creds) => dbClient.findUser(creds),
});
```
