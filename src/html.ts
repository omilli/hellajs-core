import { Props, HElement } from "./types";


function createElement(type: string): (...args: any[]) => HElement {
  return (...args: any[]) => {
    const props: Props =
      args[0] &&
      typeof args[0] === "object" &&
      !Array.isArray(args[0]) &&
      !(args[0].type && args[0].props && args[0].children)
        ? args.shift()
        : {};

    const children = args.flat().map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      } else if (
        child &&
        typeof child === "object" &&
        "type" in child &&
        "props" in child &&
        "children" in child
      ) {
        return child;
      } else {
        return String(child);
      }
    });

    // Support for 'key' property for list items
    if (props.key !== undefined) {
      // Store key in a special attribute that our diff algorithm can use
      props._key = props.key;
    }

    return { type, props, children, element: "" };
  };
}

// Create HTML element factory functions dynamically using a Proxy
export const html = new Proxy(
  {},
  {
    get: (
      target: Record<string, (...args: any[]) => HElement>,
      prop: string
    ) => {
      // Return cached function if it exists
      if (prop in target) {
        return target[prop];
      }

      // Create new element function and cache it
      const elementFn = createElement(prop);
      target[prop] = elementFn;
      return elementFn;
    },
  }
);