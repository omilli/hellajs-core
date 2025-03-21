import { delegateEvents } from "../events";
import { generateKey, storeElement } from "../store";
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
	hellaElement: HellaElement,
	container: Element,
	rootSelector: string,
): HTMLElement | Text | DocumentFragment {
	const domElement = createDomElement(hellaElement, rootSelector);

	// Clear container more efficiently than using innerHTML
	container.textContent = "";

	// Append the new element
	if (domElement instanceof DocumentFragment) {
		container.appendChild(domElement);
		// Return the container as we can't return the fragment after it's been appended
		return container as HTMLElement;
	} else {
		container.appendChild(domElement);
		return domElement;
	}
}

/**
 * Creates a DOM element based on a HellaElement or a string.
 *
 * If the input is a string, it creates aexport { events } from "./events";
 text node.
 * If the input is a HellaElement, it creates an element of the specified type,
 * applies the given properties, and processes any children.
 *
 * @param hellaElement - The HellaElement or string to create the DOM element from.
 * @returns The created HTMLElement, Text node, or DocumentFragment.
 */
export function createDomElement(
	hellaElement: HellaElement | string,
	rootSelector: string,
): HTMLElement | Text | DocumentFragment {
	if (typeof hellaElement === "string") {
		return document.createTextNode(hellaElement);
	}

	const { type, props = {}, children = [] } = hellaElement;

	if (!type) {
		return handleFragments(children, rootSelector);
	}

	// Create a DOM element based on the HellaElement's type
	const domElement = document.createElement(type) as HTMLElement;

	const elementKey = generateKey();

	domElement.dataset.hKey = elementKey;

	storeElement({
		domElement,
		elementKey,
		hellaElement,
		rootSelector,
	});

	// Apply props to the element
	handleProps(domElement, props);

	// Set up event handlers
	handleEventProps(domElement, hellaElement, rootSelector);

	// Process and render any children
	handleChildren(domElement, children, rootSelector);

	return domElement;
}

function handleFragments(
	children: HellaElement["children"],
	rootSelector: string,
): DocumentFragment {
	// Handle fragments (when type is undefined or null)
	const fragment = document.createDocumentFragment();
	handleChildren(fragment, children, rootSelector);
	return fragment;
}

/**
 * Appends rendered child elements to the specified DOM element.
 */
function handleChildren(
	domElement: HTMLElement | DocumentFragment,
	hellaChildren: HellaElement["children"] = [],
	rootSelector: string,
) {
	// Create a document fragment to batch DOM operations
	const fragment = document.createDocumentFragment();

	hellaChildren.forEach((child) => {
		const childElement = createDomElement(child, rootSelector);
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
): void {
	propHandler(props, {
		classProp(className) {
			domElement.className = className;
		},
		boolProp(key) {
			domElement.setAttribute(key, "");
		},
		regularProp(key, value) {
			domElement.setAttribute(key, String(value));
		},
	});
}

function handleEventProps(
	domElement: HTMLElement,
	hellaElement: HellaElement,
	rootSelector: string,
): void {
	const eventProps = Object.entries(hellaElement.props || {}).filter(([key]) =>
		key.startsWith("on"),
	);

	if (eventProps.length > 0) {
		domElement.dataset.eKey = generateKey();
		eventProps.forEach(() =>
			delegateEvents(
				hellaElement,
				rootSelector,
				domElement.dataset.eKey as string,
			),
		);
	}
}
