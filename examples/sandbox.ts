import { context, html } from "../lib";

const { div, ul, li, input, button } = html;

type Todo = {
  todos: string[];
  newTodo: string;
  addTodo(): void;
}

const todo = context<Todo>({
  todos: ['Learn Hella DOM', 'Build an app'],
  newTodo: '',
  addTodo() {
    if (this.newTodo.trim()) {
      this.todos = [...this.todos, this.newTodo];
      this.newTodo = '';
    }
  }
})

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
      oninput: (_: InputEvent, el: HTMLInputElement) => {
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

todo.mount(todoView)

// Define component with rendering logic
