import type { Context } from "../context";
import type { HNode } from "../types";
import { processEventProps, processProps } from "./props";

/**
 * Renders a HNode or string into the specified container.
 *
 * @param hNode - The element to render, which can be a HNode object or a string
 * @param container - The DOM element that will contain the rendered element
 * @returns The rendered DOM element (HTMLElement) or text node (Text)
 */
export function renderDomElement(
	hNode: HNode,
	rootElement: Element,
	rootSelector: string,
	context: Context<unknown>,
): HTMLElement | Text | DocumentFragment {
	const element = createDomElement(hNode, rootSelector, context);

	// Clear container more efficiently than using innerHTML
	rootElement.textContent = "";

	// Append the new element
	if (element instanceof DocumentFragment) {
		rootElement.appendChild(element);
		// Return the container as we can't return the fragment after it's been appended
		return rootElement as HTMLElement;
	} else {
		rootElement.appendChild(element);
		return element;
	}
}

/**
 * Creates a DOM element based on a HNode or a string.
 *
 * If the input is a string, it creates aexport { events } from "./events";
 text node.
 * If the input is a HNode, it creates an element of the specified type,
 * applies the given properties, and processes any children.
 *
 * @param hNode - The HNode or string to create the DOM element from.
 * @returns The created HTMLElement, Text node, or DocumentFragment.
 */
function createDomElement(
	hNode: HNode | string | number,
	rootSelector: string,
	context: Context<unknown>,
): HTMLElement | Text | DocumentFragment {
	if (typeof hNode === "string" || typeof hNode === "number") {
		return document.createTextNode(String(hNode));
	}

	const { type, props = {} } = hNode;

	if (!type) {
		return renderFragments(hNode, rootSelector, context);
	}

	const element = document.createElement(type);

	// Apply props to the element
	processProps(element, props);

	// Set up event handlers
	processEventProps(element, hNode, rootSelector);

	// Process and render any children
	renderChildren(element, hNode, rootSelector, context);

	return element;
}

function renderFragments(
	hNode: HNode,
	rootSelector: string,
	context: Context<unknown>,
): DocumentFragment {
	// Handle fragments (when type is undefined or null)
	const fragment = document.createDocumentFragment();
	renderChildren(fragment, hNode, rootSelector, context);
	return fragment;
}

/**
 * Appends rendered child elements to the specified DOM element.
 */
function renderChildren(
	element: HTMLElement | DocumentFragment,
	hNode: HNode,
	rootSelector: string,
	context: Context<unknown>,
) {
	const { children = [] } = hNode;

	// Create a document fragment to batch DOM operations
	const fragment = document.createDocumentFragment();

	children.forEach((child) => {
		const childElement = createDomElement(child, rootSelector, context);
		fragment.appendChild(childElement);
	});

	// Append all children in one operation
	element.appendChild(fragment);
}
