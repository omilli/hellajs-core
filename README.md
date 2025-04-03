# Hella

<p align="center">
  <img src="https://img.shields.io/badge/bundle-~10kb-blue" alt="Bundle Size">
  <img src="https://img.shields.io/badge/dependencies-none-green" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/status-experimental-orange" alt="Status">
</p>

A lightweight, high-performance reactive DOM library with fine-grained reactivity and efficient virtual DOM diffing.

## Features

- **🎯 Fine-grained Reactivity**: Precise dependency tracking with signals, computed values, and effects
- **⚡ Efficient DOM Updates**: Fast diffing algorithm that minimizes DOM operations
- **📦 Zero Dependencies**: Standalone implementation with no external requirements
- **🪄 Simple API**: Intuitive and minimal API surface that's easy to learn
- **🔍 TypeScript-First**: Full TypeScript support with comprehensive type definitions
- **🔄 Intelligent Batching**: Optimized rendering with automatic update batching
- **📌 Event Delegation**: Efficient event handling with minimal listeners
- **⚖️ Lightweight**: Small footprint for modern web applications

## Basic Usage

```typescript
// Erganomic HTML helpers
const { div, button, span } = html;

// Reactive state
const count = signal(0);
const increment = () => count.set(count() + 1);
const decrement = () => count.set(count() - 1);

// Reactive components
const Counter = () =>
  div(
    button({ onclick: decrement }, "-"),
    span(count()),
    button({ onclick: increment }, "+"),
  );

// Reactive DOM
mount(Counter, '#app');
```

## Core Concepts

### Reactivity System

Hella's reactivity system is built on three core primitives:

#### 1. Signals

Signals are reactive values that automatically track dependencies and trigger updates.

```typescript
import { signal } from '@hellajs/core';

// Create a signal with initial value
const count = signal(0);

// Read the current value
console.log(count()); // 0

// Update the value
count.set(5);
// or
count.update(n => n + 1);
```

#### 2. Computed Values

Computed values derive from other reactive values and automatically update when dependencies change.

```typescript
import { signal, computed } from '@hellajs/core';

const firstName = signal('John');
const lastName = signal('Doe');

// Create a computed value
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"

// When a dependency updates, the computed value automatically updates
firstName.set('Jane');
console.log(fullName()); // "Jane Doe"
```

#### 3. Effects

Effects run side effects when their dependencies change.

```typescript
import { signal, effect } from '@hellajs/core';

const user = signal({ name: 'John', role: 'Admin' });

// Run an effect when dependencies change
effect(() => {
  console.log(`User updated: ${user().name} (${user().role})`);
});

// The effect automatically runs when the signal changes
user.set({ name: 'Jane', role: 'Manager' });
// Console: "User updated: Jane (Manager)"
```

### Virtual DOM

Hella uses a lightweight virtual DOM system with a fast diffing algorithm. The `html` helper provides simple syntax for creating virtual DOM nodes:

```typescript
import { html } from '@hellajs/core';

// Using the HTML tag helpers
const { div, h1, p, button } = html;

// Create a simple component
const Header = (title) => 
  div({ className: 'header' },
    h1(title),
    p({ className: 'subtitle' }, 'Welcome to Hella!')
  );
```

### Component-Based Architecture

Components in Hella are just functions that return virtual DOM nodes. They re-render when a signal created **outside** the function changes.

```typescript
import { computed, html, mount, signal } from "../lib";
const { div, ul, li, input, button, span } = html;

const todos = signal([
  { id: 1, text: 'Learn Hella', completed: false },
  { id: 2, text: 'Build an app', completed: false }
]);

const completedTodos = computed(() => {
    return todos().filter(todo => todo.completed)
});

const newTodo = signal('');

const addTodo = () => {
  if (newTodo().trim()) {
    todos.set([
      ...todos(),
      { id: Date.now(), text: newTodo(), completed: false }
    ]);
    newTodo.set('');
  }
};

const toggleTodo = (id: number) => {
  todos.set(
    todos().map(todo => 
      todo.id === id 
      ? { ...todo, completed: !todo.completed } 
      : todo
    )
  );
};

const TodoApp = () => div({ className: 'todo-app' },
    div({ className: 'todo-header' },
      input({
        value: newTodo(),
        oninput: (_, el) => {
          newTodo.set((el as HTMLInputElement).value)
        },
        placeholder: 'What needs to be done?'
      }),
      button({ onclick: addTodo }, 'Add Todo')
    ),
    span(`Completed: ${completedTodos().length}`),
    ul({ className: 'todo-list' },
      ...todos().map(todo => 
        li({
          className: todo.completed ? 'completed' : '',
          onclick: () => toggleTodo(todo.id)
        }, todo.text)
      )
    )
  );

mount(TodoApp);
```

## Advanced Patterns

### Batch Updates

Group multiple updates to prevent unnecessary re-renders:

```typescript
import { signal, batch } from '@hellajs/core';

const firstName = signal('John');
const lastName = signal('Doe');
const age = signal(30);

// Update all signals in a single batch
batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
  age.set(28);
});
```

### Untracked Reads

Read reactive values without creating dependencies:

```typescript
import { signal, effect, untracked } from '@hellajs/core';

const count = signal(0);
const debug = signal(true);

effect(() => {
  console.log(`Count is now: ${count()}`);
  
  // This read won't create a dependency
  if (untracked(() => debug())) {
    console.log('Debug information...');
  }
});
```

### Context Isolation

Create isolated instances of the reactive system:

```typescript
import { context } from '@hellajs/core';

// Create a custom context
const ctx = context('app');

// Use context-specific APIs
const count = ctx.signal(0);
const double = ctx.computed(() => count() * 2);

ctx.effect(() => {
  console.log(`Count: ${count()}, Double: ${double()}`);
});
```
