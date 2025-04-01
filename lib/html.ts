// Import the types we need - HTMLTagName helps us enforce that we only create valid HTML elements
import type { HTMLTagName, VNode, VNodeProps } from "./types";

// Define our proxy type - it's a bit complex but basically creates a function for each HTML tag
type HTMLElementProxy = {
	// For each HTML tag, we create a function that can be called in two ways:
	[K in HTMLTagName]: {
		// Either with props first, then children: html.div({ className: 'foo' }, 'hello')
		(props?: VNodeProps<K>, ...children: (VNode | string | number)[]): VNode<K>;
		// Or just with children directly: html.div('hello', 'world')
		(...children: (VNode | string | number)[]): VNode<K>;
	};
};

/**
 * The html object provides a JSX-like API for creating virtual DOM elements.
 * It uses a Proxy to dynamically generate element creation functions for any HTML tag.
 */
// The magic happens here - we create a proxy that pretends to have methods for every HTML tag
export const html = new Proxy({} as HTMLElementProxy, {
	// This get handler is called whenever you access a property on the html object
	get: (target: HTMLElementProxy, prop: string | symbol) => {
		// Let's ignore special properties like Symbol.iterator or __proto__
		if (typeof prop !== "string" || prop.startsWith("__")) {
			// Just pass these through to the target object normally
			return Reflect.get(target, prop, target);
		}
		// At this point, we assume prop is a valid HTML tag name like 'div' or 'span'
		const tagName = prop as HTMLTagName;
		// If we've already created a function for this tag, just return it - no need to recreate
		if (tagName in target) {
			return target[tagName];
		}
		// Otherwise, create a new function for this tag and store it for future use
		const elementFn = createElement(tagName);
		// The type system doesn't fully understand our dynamic approach, so we need this cast
		// biome-ignore lint/suspicious/noExplicitAny:
		target[tagName] = elementFn as any;
		// And return the newly created function to the caller
		return elementFn;
	},
});

/**
 * Creates a function that generates virtual DOM nodes for a specific HTML tag type.
 * The returned function accepts props and children, handling various input formats.
 *
 * @param type - The HTML tag name (e.g., 'div', 'span', 'button')
 * @returns A function that creates virtual DOM nodes (VNode objects)
 */
// This function creates element-specific creator functions (like html.div, html.span)
function createElement<T extends HTMLTagName>(type: T) {
	// Return a function that accepts various arguments and returns a virtual DOM node
	return (...args: VNode[]): VNode<T> => {
		// We'll figure out which parts are props and which are children
		let props: VNodeProps<T>;
		let children: (VNode | string)[];
		// Check if the first argument looks like a props object or is actually a child
		if (
			args[0] &&
			typeof args[0] === "object" &&
			!Array.isArray(args[0]) &&
			!(
				// Make sure the first arg isn't already a VNode (which is also an object)
				(
					(args[0] as VNode).type &&
					(args[0] as VNode).props &&
					(args[0] as VNode).children
				)
			)
		) {
			// First argument is props, so extract it and get children from the rest
			props = args[0] as VNodeProps<T>;
			children = args
				.slice(1) // Take everything after the props
				.flat() // Flatten any nested arrays for convenience
				.map((child) => {
					// Convert numbers to strings for text nodes
					if (typeof child === "string" || typeof child === "number") {
						return String(child);
					}
					return child as VNode;
				});
		} else {
			// No props provided, so first argument is actually a child
			props = {} as VNodeProps<T>;
			children = args.flat().map((child) => {
				// Same conversion as above - ensure text is properly handled
				if (typeof child === "string" || typeof child === "number") {
					return String(child);
				}
				return child as VNode;
			});
		}
		// Finally, assemble and return our virtual DOM node with the right type, props, and children
		return { type, props, children };
	};
}
