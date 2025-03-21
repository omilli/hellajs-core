import type { ContextState } from "../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { storeElement } from "./store";
import { propHandler } from "./utils";

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
	context: ContextState,
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
	context: ContextState,
): HTMLElement | Text | DocumentFragment {
	if (typeof hNode === "string" || typeof hNode === "number") {
		return document.createTextNode(String(hNode));
	}

	const { type, props = {} } = hNode;

	if (!type) {
		return handleFragments(hNode, rootSelector, context);
	}

	const element = handleElement(hNode, rootSelector, context);

	// Apply props to the element
	handleProps(element, props);

	// Set up event handlers
	handleEventProps(element, hNode, rootSelector);

	// Process and render any children
	handleChildren(element, hNode, rootSelector, context);

	return element;
}

function handleFragments(
	hNode: HNode,
	rootSelector: string,
	context: ContextState,
): DocumentFragment {
	// Handle fragments (when type is undefined or null)
	const fragment = document.createDocumentFragment();
	handleChildren(fragment, hNode, rootSelector, context);
	return fragment;
}

function handleElement(
	hNode: HNode,
	rootSelector: string,
	context: ContextState,
) {
	const element = document.createElement(hNode.type!) as HTMLElement;
	const elementKey = generateKey();

	storeElement(hNode, element, rootSelector, elementKey, context);

	return element;
}

/**
 * Sets HTML attributes and properties on a DOM element
 */
function handleProps(element: HTMLElement, props: HNode["props"] = {}): void {
	propHandler(props, {
		classProp(className) {
			element.className = className;
		},
		boolProp(key) {
			element.setAttribute(key, "");
		},
		regularProp(key, value) {
			element.setAttribute(key, String(value));
		},
	});
}

function handleEventProps(
	element: HTMLElement,
	hNode: HNode,
	rootSelector: string,
): void {
	const eventProps = Object.entries(hNode.props || {}).filter(([key]) =>
		key.startsWith("on"),
	);

	if (eventProps.length > 0) {
		element.dataset.eKey = generateKey();
		delegateEvents(hNode, rootSelector, element.dataset.eKey as string);
	}
}

/**
 * Appends rendered child elements to the specified DOM element.
 */
function handleChildren(
	element: HTMLElement | DocumentFragment,
	hNode: HNode,
	rootSelector: string,
	context: ContextState,
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
