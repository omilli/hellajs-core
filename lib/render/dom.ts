import { getDefaultContext } from "../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { storeElement } from "./store";
import type { RenderDomArgs, RenderedElement } from "./types";
import { propHandler } from "./utils";

const getDomArgs = (args: RenderDomArgs) =>
	({
		...{
			hNode: {},
			rootElement: document.body,
			element: document.createDocumentFragment(),
			rootSelector: "body",
			context: getDefaultContext(),
		},
		...args,
	}) as Required<RenderDomArgs>;

/**
 * Renders a HNode or string into the specified container.
 *
 * @param hNode - The element to render, which can be a HNode object or a string
 * @param container - The DOM element that will contain the rendered element
 * @returns The rendered DOM element (HTMLElement) or text node (Text)
 */
export function renderDomElement(args: RenderDomArgs): RenderedElement {
	const { hNode, rootElement, rootSelector, context } = getDomArgs(args);

	if (!rootElement) {
		throw new Error("Root element is required");
	}

	const element = createDomElement({ hNode, rootSelector, context });

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
export function createDomElement(args: RenderDomArgs): RenderedElement {
	const { hNode, rootSelector, context } = getDomArgs(args);

	if (typeof hNode === "string") {
		return document.createTextNode(hNode);
	}

	const { type } = hNode;

	if (!type) {
		return handleFragments({ hNode, rootSelector, context });
	}

	// Create a DOM element based on the HNode's type
	const element = document.createElement(type) as HTMLElement;

	const elementKey = generateKey();

	element.dataset.hKey = elementKey;

	storeElement({
		context,
		element,
		elementKey,
		hNode,
		rootSelector,
	});

	// Apply props to the element
	handleProps({element, hNode});

	// Set up event handlers
	handleEvents({element, hNode, rootSelector});

	// Process and render any children
	handleChildren({ element, hNode, rootSelector, context });

	return element;
}

function handleFragments(args: RenderDomArgs): DocumentFragment {
	const { hNode, rootSelector, context } = getDomArgs(args);
	const element = document.createDocumentFragment();

	handleChildren({ element, hNode, rootSelector, context });

	return element;
}

/**
 * Appends rendered child elements to the specified DOM element.
 */
function handleChildren(args: RenderDomArgs) {
	let { hNode, rootSelector, context, element } = getDomArgs(args);
	hNode = hNode as HNode
	
	// Create a document fragment to batch DOM operations
	const fragment = document.createDocumentFragment();

	hNode.children?.forEach((child) => {
		const childElement = createDomElement({
			hNode: child,
			rootSelector,
			context,
		});
		fragment.appendChild(childElement);
	});

	// Append all children in one operation
	element.appendChild(fragment);
}

/**
 * Sets HTML attributes and properties on a DOM element
 */
function handleProps(
	args: RenderDomArgs
): void {
	let { hNode, element } = getDomArgs(args);
	hNode = hNode as HNode
	element = element as HTMLElement

	propHandler(hNode.props || {}, {
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

function handleEvents(
	args: RenderDomArgs
): void {
	let { hNode, element, rootSelector } = getDomArgs(args);
	hNode = hNode as HNode;
	element = element as HTMLElement;

	const eventProps = Object.entries(hNode.props || {}).filter(([key]) =>
		key.startsWith("on"),
	);

	if (eventProps.length > 0) {
		element.dataset.eKey = generateKey();
		eventProps.forEach(() =>
			delegateEvents(
				hNode,
				rootSelector,
				element.dataset.eKey as string,
			),
		);
	}
}
