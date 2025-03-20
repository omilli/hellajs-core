import { delegateEvents } from "../events";
import type { HellaElement } from "../types";
import { propHandler } from "./utils";

/**
 * Renders a HellaElement or string into the specified container.
 *
 * @param hellaElement - The element to render, which can be a HellaElement object or a string
 * @param container - The DOM element that will contain the rendered element
 * @returns The rendered DOM element (HTMLElement) or text node (Text)
 */
export function renderDomElement(
	hellaElement: HellaElement | string,
	container: Element,
): HTMLElement | Text | DocumentFragment {
	// Create DOM element
	const element = createDomElement(hellaElement);

	// Clear container more efficiently than using innerHTML
	container.textContent = "";

	// Append the new element
	if (element instanceof DocumentFragment) {
		container.appendChild(element);
		// Return the container as we can't return the fragment after it's been appended
		return container as HTMLElement;
	} else {
		container.appendChild(element);
		return element;
	}
}

/**
 * Creates a DOM element from a HellaElement without attaching it to the DOM
 */
function createDomElement(
	hellaElement: HellaElement | string,
): HTMLElement | Text | DocumentFragment {
	if (typeof hellaElement === "string") {
		return document.createTextNode(hellaElement);
	}

	const { type, props, children } = hellaElement;

	// Handle fragments (when type is undefined or null)
	if (!type) {
		const fragment = document.createDocumentFragment();
		handleChildren(fragment, children);
		return fragment;
	}

	// Create a DOM element based on the HellaElement's type
	const domElement = document.createElement(type) as HTMLElement;

	// Apply props to the element
	handleProps(domElement, props || {});

	// Set up event handlers
	delegateEvents(domElement, props);

	// Process and render any children
	handleChildren(domElement, children);

	return domElement;
}

/**
 * Appends rendered child elements to the specified DOM element.
 */
function handleChildren(
	domElement: HTMLElement | DocumentFragment,
	hellaChildren: HellaElement["children"] = [],
) {
	// Create a document fragment to batch DOM operations
	const fragment = document.createDocumentFragment();

	hellaChildren.forEach((child) => {
		const childElement = createDomElement(child);
		fragment.appendChild(childElement);
	});

	// Append all children in one operation
	domElement.appendChild(fragment);
}

/**
 * Sets HTML attributes and properties on a DOM element
 */
function handleProps(
	domElement: HTMLElement,
	props: HellaElement["props"] = {},
) {
	propHandler(props, {
		classProp: (className) => {
			domElement.className = className;
		},
		boolProp: (key) => {
			domElement.setAttribute(key, "");
		},
		regularProp: (key, value) => {
			domElement.setAttribute(key, String(value));
		},
	});
}
