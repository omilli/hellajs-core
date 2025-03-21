import type { HTMLTagName, HNode, HNodeProps } from "./types";

function createElement(type: HTMLTagName): (...args: any[]) => HNode {
	return (...args: any[]) => {
		const props: HNodeProps =
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

		return { type, props, children, element: "" };
	};
}

// Create HTML element factory functions dynamically using a Proxy
export const html = new Proxy(
	{},
	{
		get: (
			target: Record<string, (...args: any[]) => HNode>,
			prop: HTMLTagName,
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
	},
);
