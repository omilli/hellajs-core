import { elementMap, render } from "../lib";
import { renderStringElement } from "../lib/render";

console.log(renderStringElement({
  props: {
    className: "foo"
  },
  children: [
    {
      type: "div",
      children:["Hello"]
    },
    "Hi",
  ]
}))


render({
  type: "div",
  props: {
    className: "foo"
  },
  children: [
    {
      children:["Hello"]
    },
  ]
}, "#root");

console.log(elementMap.get("#root"));

