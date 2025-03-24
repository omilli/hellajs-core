import { html } from "../lib";
import { component } from "../lib/component";
import { context } from "../lib/context";

const { div, ul, li, input, button } = html;

const todo = context({initialState:{
  todos: ['Learn Hella DOM', 'Build an app'],
  newTodo: ''
}})

function addTodo() {
  if (todo.state.newTodo.trim()) {
    todo.state.todos = [...todo.state.todos, todo.state.newTodo];
    todo.state.newTodo = '';
  }
}

// Create a function that returns a hNode
const todoView = () =>
  div({ className: 'todo-app' },
    input({
      value: todo.state.newTodo,
      oninput: (e: InputEvent, el: HTMLInputElement) => {
        todo.state.newTodo = el.value
      },
      placeholder: 'Enter a new todo'
    }),
    button({
      onclick: () => addTodo()
    }, 'Add Todo'),
    ul(...todo.state.todos.map(todo => 
        li({}, todo)
      )
    )
  );

// Define component with rendering logic
component(todoView);