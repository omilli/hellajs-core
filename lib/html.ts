import type { HTMLTagName, VNode, VNodeProps } from "./types";

/**
 * The html object provides a JSX-like API for creating virtual DOM elements.
 * It uses a Proxy to dynamically generate element creation functions for any HTML tag.
 */
export const html = new Proxy(
	{},
	{
		get: (
			target: Record<string, (...args: any[]) => VNode>,
			prop: HTMLTagName,
		) => {
			// Return cached function if it exists
			if (prop in target) {
				return target[prop];
			}

			// Create new element function and cache it for future use
			// This avoids recreating functions for commonly used elements
			const elementFn = createElement(prop);
			target[prop] = elementFn;
			return elementFn;
		},
	},
);

/**
 * Creates a function that generates virtual DOM nodes for a specific HTML tag type.
 * The returned function accepts props and children, handling various input formats.
 *
 * @param type - The HTML tag name (e.g., 'div', 'span', 'button')
 * @returns A function that creates virtual DOM nodes (VNode objects)
 */
function createElement(type: HTMLTagName): (...args: any[]) => VNode {
	return (...args: any[]) => {
		// Extract props object if the first argument is a valid props object
		// Otherwise use an empty object as props
		const props: VNodeProps =
			args[0] &&
			typeof args[0] === "object" &&
			!Array.isArray(args[0]) &&
			!(args[0].type && args[0].props && args[0].children)
				? args.shift()
				: {};

		// Process children, handling different types:
		// - Strings and numbers are converted to text nodes
		// - Nested VNode objects are kept as-is
		// - Other values are stringified
		const children = args.flat().map((child) => {
			if (typeof child === "string" || typeof child === "number") {
				// Text nodes are represented as strings
				return String(child);
			}
			if (
				child &&
				typeof child === "object" &&
				"type" in child &&
				"props" in child &&
				"children" in child
			) {
				// Child is already an VNode, pass through unchanged
				return child;
			}
			// Convert other values to strings
			return String(child);
		});

		// Create and return the virtual DOM node
		// The element property is initially empty and will be
		// populated when the virtual node is rendered to the DOM
		return { type, props, children, element: "" };
	};
}
