import type { Context } from "../context";
import type { RenderedElement, VNode, VNodeValue } from "../types";
import { processEventProps, processProps } from "./props";

/**
 * Renders an VNode to the DOM by creating a DOM element and appending it to the specified root element.
 * Clears the root element's content before appending the new element.
 *
 * @param vNode - The hierarchical node to render
 * @param rootElement - The DOM element that will contain the rendered element
 * @param rootSelector - A CSS selector for the root element
 * @param context - The context object for rendering
 *
 * @returns The rendered DOM element, text node, or in case of a DocumentFragment,
 *          returns the root element since fragments get emptied when appended
 */
export function renderDomElement(
	vNode: VNode,
	rootElement: Element,
	rootSelector: string,
	context: Context,
): RenderedElement | DocumentFragment {
	const element = createDomElement(vNode, rootSelector, context);

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
 * Creates a DOM element based on the provided VNode.
 *
 * This function handles different types of VNodes:
 * - If the VNode is a string or number, it creates a text node.
 * - If the VNode has a type, it creates an HTML element of that type.
 * - If the VNode has no type, it treats it as a fragment and processes its children.
 *
 * @param vNode - The hierarchical node to render
 * @param rootSelector - A CSS selector for the root element
 * @param context - The context object for rendering
 *
 * @returns The created DOM element, text node, or document fragment
 */
function createDomElement(
	vNode: VNodeValue,
	rootSelector: string,
	context: Context,
): RenderedElement {
	if (typeof vNode === "string" || typeof vNode === "number") {
		return document.createTextNode(String(vNode));
	}

	const { type, props = {} } = vNode;

	if (!type) {
		// Handle fragments (when type is undefined or null)
		const fragment = document.createDocumentFragment();
		renderChildren(fragment, vNode, rootSelector, context);
		return fragment;
	}

	const element = document.createElement(type);

	// Apply props to the element
	processProps(element, props);

	// Set up event handlers
	processEventProps(element, vNode, rootSelector);

	// Process and render any children
	renderChildren(element, vNode, rootSelector, context);

	return element;
}

/**
 * Renders the children of a given VNode into the specified DOM element.
 *
 * @param element - The DOM element to which the children will be appended
 * @param vNode - The hierarchical node containing the children to render
 * @param rootSelector - A CSS selector for the root element
 * @param context - The context object for rendering
 */
function renderChildren(
	element: HTMLElement | DocumentFragment,
	vNode: VNode,
	rootSelector: string,
	context: Context,
) {
	const { children = [] } = vNode;

	// Create a document fragment to batch DOM operations
	const fragment = document.createDocumentFragment();

	children.forEach((child) => {
		const childElement = createDomElement(child, rootSelector, context);
		fragment.appendChild(childElement);
	});

	// Append all children in one operation
	element.appendChild(fragment);
}
