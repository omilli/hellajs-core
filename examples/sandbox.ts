import { component } from "../lib/component";
import { state } from "../lib/state";

const myState = state({
  count: 1,
});

console.log(myState.count)

function increment() {
  myState.count = myState.count + 1;
  console.log(myState.count)
}

function decrement() {
  myState.count = myState.count - 1;
  console.log(myState.count)
}

component(myState, () => ({
  type: "div",
  children: [
    {
      type: "button",
      props: {
        onclick: increment,
      },
      children: ["Increment"]
    },
    {
      type: "button",
      props: {
        onclick: decrement,
      },
      children: ["Decrement"]
    },
    {
      type: "p",
      children: [myState.count]
    }
  ]
}));


