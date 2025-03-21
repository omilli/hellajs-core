import type { ContextState } from "../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { storeElement } from "./store";
import { propHandler } from "./utils";

/**
 * Renders a HNode or string into the specified container.
 *
 * @param hnode - The element to render, which can be a HNode object or a string
 * @param container - The DOM element that will contain the rendered element
 * @returns The rendered DOM element (HTMLElement) or text node (Text)
 */
export function renderDomElement(
	hnode: HNode,
	rootElement: Element,
	rootSelector: string,
	context: ContextState,
): HTMLElement | Text | DocumentFragment {
	const element = createDomElement(hnode, rootSelector, context);

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
 * @param hnode - The HNode or string to create the DOM element from.
 * @returns The created HTMLElement, Text node, or DocumentFragment.
 */
export function createDomElement(
	hnode: HNode | string | number,
	rootSelector: string,
	context: ContextState,
): HTMLElement | Text | DocumentFragment {
	if (typeof hnode === "string" || typeof hnode === "number") {
		return document.createTextNode(String(hnode));
	}

	const { type, props = {}, children = [] } = hnode;

	if (!type) {
		return handleFragments(children, rootSelector, context);
	}

	// Create a DOM element based on the HNode's type
	const element = document.createElement(type) as HTMLElement;

	const elementKey = generateKey();

	element.dataset.hKey = elementKey;

	storeElement(context, rootSelector, elementKey, element, hnode);

	// Apply props to the element
	handleProps(element, props);

	// Set up event handlers
	handleEventProps(element, hnode, rootSelector);

	// Process and render any children
	handleChildren(element, children, rootSelector, context);

	return element;
}

function handleFragments(
	children: HNode["children"],
	rootSelector: string,
	context: ContextState,
): DocumentFragment {
	// Handle fragments (when type is undefined or null)
	const fragment = document.createDocumentFragment();
	handleChildren(fragment, children, rootSelector, context);
	return fragment;
}

/**
 * Appends rendered child elements to the specified DOM element.
 */
function handleChildren(
	element: HTMLElement | DocumentFragment,
	children: HNode["children"] = [],
	rootSelector: string,
	context: ContextState,
) {
	// Create a document fragment to batch DOM operations
	const fragment = document.createDocumentFragment();

	children.forEach((child) => {
		const childElement = createDomElement(child, rootSelector, context);
		fragment.appendChild(childElement);
	});

	// Append all children in one operation
	element.appendChild(fragment);
}

/**
 * Sets HTML attributes and properties on a DOM element
 */
function handleProps(
	element: HTMLElement,
	props: HNode["props"] = {},
): void {
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
	hnode: HNode,
	rootSelector: string,
): void {
	const eventProps = Object.entries(hnode.props || {}).filter(([key]) =>
		key.startsWith("on"),
	);

	if (eventProps.length > 0) {
		element.dataset.eKey = generateKey();
		eventProps.forEach(() =>
			delegateEvents(
				hnode,
				rootSelector,
				element.dataset.eKey as string,
			),
		);
	}
}
