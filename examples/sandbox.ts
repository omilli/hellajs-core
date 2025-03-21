import { render } from "../lib";
import { getRootContext } from "../lib/context";
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
    onclick(e, el) {
      console.log(e, el);
    },
  },
  children: [
    {
      type: "p",
      children:["Hello"]
    },
  ]
}, "#root");

console.log(getRootContext("#root"));
