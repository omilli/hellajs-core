# Hella

A lightweight, high-performance reactive DOM library with a fine-grained reactivity system and efficient virtual DOM diffing.

## Core Features

- **🚀 Fine-grained Reactivity**: Precise dependency tracking with signals, computed values, and effects
- **⚡ Efficient DOM Updates**: Fast diffing algorithm that minimizes DOM operations
- **🧩 Functional Component Model**: Simple functional approach to building UI components
- **📦 Zero Dependencies**: Standalone implementation with no external requirements
- **🔄 Batched Updates**: Optimized rendering with intelligent update batching
- **🎯 Event Delegation**: Efficient event handling that minimizes listeners
- **📝 TypeScript Support**: Full TypeScript support with comprehensive type definitions

## Reactive Primitives

### Signals

Signals are reactive values that trigger updates when they change:

```typescript
import { signal, effect } from "@hellajs/reactive";

// Create a reactive value
const count = signal(0);

// Read the value
console.log(count()); // 0

// Update the value
count.set(1);
// or 
count.update(prev => prev + 1);

// Automatically track changes with effects
effect(() => {
  console.log(`Count changed: ${count()}`);
});
```

### Computed Values

Computed values derive from other reactive values:

```typescript
import { signal, computed } from "@hellajs/reactive";

const firstName = signal("John");
const lastName = signal("Doe");

const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

// Updates when dependencies change
firstName.set("Jane");
console.log(fullName()); // "Jane Doe"
```

### Effects

Effects run when their reactive dependencies change:

```typescript
import { signal, effect } from "@hellajs/reactive";

const user = signal({ name: "John", age: 30 });

effect(() => {
  console.log(`User updated: ${user().name}, ${user().age}`);
});

// Effect runs automatically when user changes
user.set({ name: "Jane", age: 28 });
```

## DOM Rendering

### HTML Helper

Create DOM nodes with a simple, familiar syntax:

```typescript
import { html } from "@hellajs/reactive";

const { div, button, span } = html;

// Create a div with a button
const view = () => 
  div({ className: "container" },
    button({ 
      className: "btn",
      onClick: () => console.log("Clicked!") 
    }, 
    "Click me!"
    )
  );
```

### Mounting Components

Combine signals with HTML helpers to create reactive components:

```typescript
import { signal, html, mount } from "@hellajs/reactive";

const { div, button } = html;

// Create a counter component
function Counter() {
  const count = signal(0);
  
  const increment = () => count.set(count() + 1);
  const decrement = () => count.set(count() - 1);
  
  return () => div({ className: "counter" },
    button({ onClick: decrement }, "-"),
    div({ className: "count" }, count()),
    button({ onClick: increment }, "+")
  );
}

// Mount the component to the DOM
mount(Counter());
```

## Batch Updates

Group multiple updates to prevent unnecessary re-renders:

```typescript
import { signal, batch } from "@hellajs/reactive";

const firstName = signal("John");
const lastName = signal("Doe");
const age = signal(30);

// All three signals update in a single batch
batch(() => {
  firstName.set("Jane");
  lastName.set("Smith");
  age.set(28);
});
```

## Advanced Features

### Untracked Reads

Read reactive values without creating dependencies:

```typescript
import { signal, effect, untracked } from "@hellajs/reactive";

const count = signal(0);
const debug = signal(true);

effect(() => {
  console.log(`Count: ${count()}`);
  
  // This read won't create a dependency
  if (untracked(() => debug())) {
    console.log("Debug mode is on");
  }
});
```

### Context Management

Create isolated instances of the reactive system:

```typescript
import { context } from "@hellajs/reactive";

// Create a custom context
const ctx = context("my-app");

// Use context-specific APIs
const count = ctx.signal(0);
const double = ctx.computed(() => count() * 2);

ctx.effect(() => {
  console.log(`Count: ${count()}, Double: ${double()}`);
});
```

## Browser Support

Hella supports all modern browsers (Chrome, Firefox, Safari, Edge).

## Installation

```bash
npm install @hellajs/reactive
```

## License

MIT
