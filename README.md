# Hella DOM

A lightweight and performant DOM manipulation library that uses JSON-like virtual DOM objects for efficient rendering and diffing without JSX.

## Features

- 🚀 Fast diffing algorithm
- 🎯 Zero dependencies
- 💡 Simple JSON-like syntax
- 🔄 State management with reactive updates
- 📦 Component-based architecture
- 🎨 Event delegation 
- 🌐 Server-side rendering support
- 🛠️ TypeScript support

## Core Concepts

### Virtual DOM with hNode

The core of Hella DOM is the `hNode` structure - a simple JavaScript object that represents DOM elements:

```typescript
// An hNode representing a button
const buttonNode = {
  type: 'button',
  props: {
    className: 'primary-btn',
    onclick: () => console.log('Clicked!')
  },
  children: ['Click me']
};
```

### Components with State Management

Components combine state and rendering logic for reactive UI updates:

```typescript
import { component, state, html } from '@hellajs/dom';

const { div, ul, li, input, button } = html;

// Create state object with initial values
const todoState = state({
  todos: ['Learn Hella', 'Build an app'],
  newTodo: ''
});

function addTodo() {
  if (todoState.newTodo.trim()) {
    todoState.todos = [...todoState.todos, todoState.newTodo];
    todoState.newTodo = '';
  }
}

// Create a function that returns a hNode
const todoView = () =>
  div({ className: 'todo-app' },
    input({
      value: todoState.newTodo,
      oninput: (e: InputEvent, el: HTMLInputElement) => {
        todoState.newTodo = el.value
      },
      placeholder: 'Enter a new todo'
    }),
    button({
      onclick: () => addTodo()
    }, 'Add Todo'),
    ul(...todoState.todos.map(todo => 
        li({}, todo)
      )
    )
  );

// Define component with rendering logic
component(todoState, todoView);
```

### HTML Helper

The `html` helper provides a cleaner way to create elements:

```typescript
import { html } from '@hellajs/dom';
const { div, button, span } = html;

const myComponent = () => 
  div({ className: 'container' },
    button({ 
      className: 'btn',
      onclick: () => console.log('clicked!')
    },
    'Click me!'
    )
  );
```

### Server-Side Rendering

Hella DOM works in server environments too:

```typescript
import { render } from '@hellajs/dom';

const element = {
  type: 'div',
  props: { className: 'server' },
  children: ['Hello Server!']
};

const html = render(element); // Returns HTML string in server environment
```