import { HNode } from "../lib";
import { component } from "../lib/component";
import { state } from "../lib/state";

const myState = state({
  count: 0,
  rows: [] as HNode[]
});

setInterval(() => {
  myState.count = myState.count + 1;
  setRows();
}, 1)

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
  children: myState.rows
}));


