import { html } from "../lib";
import { component } from "../lib/component";
import { state } from "../lib/state";

const { div, ul, li, input, button } = html;

// Create state object with initial values
const todoState = state({
  todos: ['Learn Hella DOM', 'Build an app'],
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