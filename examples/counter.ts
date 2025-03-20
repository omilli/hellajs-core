import { html } from "../lib/html";
import { component } from "../lib/component";
import { state } from "../lib/state";

const { div, button } = html;

const counterState = state({
  count: 0
});

const counterComponent = () => div(
  button({ onclick: () => counterState.count-- }, "Decrement"),
  button({ onclick: () => counterState.count++ }, "Increment"),
  div(`Count: ${counterState.count}`)
);

const Counter = component({
  state: counterState,
  render: counterComponent
}, "#root");

Counter();

// import { render } from "../lib";
// import { renderStringElement } from "../lib/render";

// console.log(renderStringElement({
//   props: {
//     className: "foo"
//   },
//   children: [
//     {
//       type: "div",
//       children:["Hello"]
//     },
//     "Hi",
//   ]
// }))


// render({
//   type: "div",
//   props: {
//     className: "foo"
//   },
//   children: [
//     {
//       children:["Hello"]
//     },
//   ]
// }, "#root");

