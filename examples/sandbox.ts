import { HNode } from "../lib";
import { component } from "../lib/component";
import { state } from "../lib/state";

const myState = state({
  count: 10000,
  rows: [] as HNode[]
});


function increment() {
  myState.count = myState.count + 1;
  setRows();
}

function decrement() {
  myState.count = myState.count - 1;
  setRows();
}

function setRows() {
  myState.rows = Array.from({ length: myState.count }, (_, i) => ({
    type: "div",
    props: {
      onclick: () => console.log(i)
    },
    children: [String(i)]
  })).reverse() as HNode[]
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
      type: "div",
      children: myState.rows
    }
  ]
}));


