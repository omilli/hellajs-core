import { elementStore, eventStore, render } from "../lib";
import { renderStringElement } from "../lib/render";

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


render({
  type: "div",
  props: {
    className: "foo",
    onclick: () => console.log("clicked")
  },
  children: [
    {
      type: "p",
      children:["Hello"]
    },
  ]
}, "#root");

console.log(elementStore.get("#root"));
console.log(eventStore);
