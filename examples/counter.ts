// import { html } from "../lib/html";
// import { component } from "../lib/component";
// import { state } from "../lib/state";

import { render } from "../lib";

// const { div, button } = html;

// const counterState = state({
//   count: 0
// });

// const counterComponent = () => div(
//   button({ onclick: () => counterState.count-- }, "Decrement"),
//   button({ onclick: () => counterState.count++ }, "Increment"),
//   div(`Count: ${counterState.count}`)
// );

// const Counter = component({
//   state: counterState,
//   render: counterComponent
// }, "#root");

// Counter();


render({
  type: "div",
  children: [
    "hello",
  ]
}, "#root");

