import { getDefaultContext } from "../../context";
import type { VNode } from "../types";
import { getRootElement } from "../utils";
import { diffChildren } from "./children";
import { renderElement } from "./render";
import type { DiffConfig } from "./types";

/**
 * Updates an existing DOM tree with changes from a virtual DOM node.
 * This is the main entry point for the virtual DOM diffing algorithm.
 *
 * When the root element already has children, it performs an intelligent diff
 * to minimize DOM operations. Otherwise, it performs a fresh render.
 *
 * @param vNode - The virtual DOM node representing the new state
 * @param rootSelector - CSS selector string identifying where to mount the DOM
 * @param context - Optional context object with reactivity settings (uses default if not provided)
 * @returns The resulting DOM element, text node, or document fragment
 */
export function diff(
	vNode: VNode,
	rootSelector: string,
	context = getDefaultContext(),
): HTMLElement | Text | DocumentFragment {
	// Get a dom reference to the root element
	const rootElement = getRootElement(rootSelector);
	// Check if the root element has children
	const hasChildren = rootElement.childNodes.length > 0;
	// Set the configuration for diffing this virtual node
	const diffConfig: DiffConfig = {
		vNode,
		rootSelector,
		rootElement,
		context,
		};
	// Handle diffing based on whether the root element has children or not
	return hasChildren ? handleChildren(diffConfig) : handleChildess(diffConfig);
}

/**
 * Handles diffing when the root element already has children.
 * This efficiently updates existing DOM nodes instead of recreating them.
 *
 * @param diffConfig - Configuration object containing the virtual node, root element, and context
 * @returns The updated root element after diffing
 */
function handleChildren({
	vNode,
	rootSelector,
	rootElement,
	context,
}: DiffConfig) {
	// Count the number of child nodes in the root element
	const childLength = rootElement.childNodes.length;
	// Create an array to hold the child nodes
	const children = new Array(childLength);
	// Populate the array with the child nodes to avoid issues with live NodeList
	for (let i = 0; i < childLength; i++) {
		// Store each child node in the array
		children[i] = rootElement.childNodes[i] as HTMLElement | Text;
	}
	// Perform the diffing process on the child nodes
	diffChildren(children, [vNode], rootElement, rootSelector, context);
	// Return the root element
	return rootElement as HTMLElement;
}

/**
 * Handles diffing when the root element has no children.
 * This performs a fresh render and appends the new elements to the root.
 *
 * @param diffConfig - Configuration object containing the virtual node, root element, and context
 * @returns The newly created element or the root element for fragments
 */
function handleChildess({
	vNode,
	rootSelector,
	rootElement,
	context,
}: DiffConfig) {
	// Render the virtual node to the DOM
	const element = renderElement(vNode, rootSelector, context);
	// Append the rendered element to the root element
	rootElement.appendChild(element);
	// Return the element unless it's a DocumentFragment, in which case return the root element
	return element instanceof DocumentFragment
		? (rootElement as HTMLElement)
		: element;
}
