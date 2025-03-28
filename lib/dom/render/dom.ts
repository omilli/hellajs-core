import type { Context } from "../../context";
import type { HNode } from "../types";
import { processEventProps, processProps } from "./props";

/**
 * Renders an HNode to the DOM by creating a DOM element and appending it to the specified root element.
 * Clears the root element's content before appending the new element.
 *
 * @param hNode - The hierarchical node to render
 * @param rootElement - The DOM element that will contain the rendered element
 * @param rootSelector - A CSS selector for the root element
 * @param context - The context object for rendering
 *
 * @returns The rendered DOM element, text node, or in case of a DocumentFragment,
 *          returns the root element since fragments get emptied when appended
 */
export function renderDomElement(
	hNode: HNode,
	rootElement: Element,
	rootSelector: string,
	context: Context,
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
 * Creates a DOM element based on the provided HNode.
 *
 * This function handles different types of HNodes:
 * - If the HNode is a string or number, it creates a text node.
 * - If the HNode has a type, it creates an HTML element of that type.
 * - If the HNode has no type, it treats it as a fragment and processes its children.
 *
 * @param hNode - The hierarchical node to render
 * @param rootSelector - A CSS selector for the root element
 * @param context - The context object for rendering
 *
 * @returns The created DOM element, text node, or document fragment
 */
function createDomElement(
	hNode: HNode | string | number,
	rootSelector: string,
	context: Context,
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

/**
 * Renders a fragment by creating a document fragment and appending its children.
 *
 * @param hNode - The hierarchical node to render
 * @param rootSelector - A CSS selector for the root element
 * @param context - The context object for rendering
 *
 * @returns A DocumentFragment containing the rendered children
 */
function renderFragments(
	hNode: HNode,
	rootSelector: string,
	context: Context,
): DocumentFragment {
	// Handle fragments (when type is undefined or null)
	const fragment = document.createDocumentFragment();
	renderChildren(fragment, hNode, rootSelector, context);
	return fragment;
}

/**
 * Renders the children of a given HNode into the specified DOM element.
 *
 * @param element - The DOM element to which the children will be appended
 * @param hNode - The hierarchical node containing the children to render
 * @param rootSelector - A CSS selector for the root element
 * @param context - The context object for rendering
 */
function renderChildren(
	element: HTMLElement | DocumentFragment,
	hNode: HNode,
	rootSelector: string,
	context: Context,
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
