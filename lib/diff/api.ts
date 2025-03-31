import { getDefaultContext } from "../context";
import { renderElement } from "../render/element";
import type { RenderedElement, VNode } from "../types";
import { getRootElement } from "../utils";
import { diffChildren } from "./children";

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
): RenderedElement | DocumentFragment {
	// Get a dom reference to the root element
	const rootElement = getRootElement(rootSelector);
	// Check if the root element has children
	const hasChildren = rootElement.childNodes.length > 0;
	if (hasChildren) {
		// Perform the diffing process on the child nodes
		diffChildren([vNode], rootElement, rootSelector, context);
		return rootElement as HTMLElement;
	}
	// Render the virtual node to the DOM
	const element = renderElement(vNode, rootSelector, context);
	// Append the rendered element to the root element
	rootElement.appendChild(element);
	// Return the element unless it's a DocumentFragment, in which case return the root element
	return element instanceof DocumentFragment
		? (rootElement as HTMLElement)
		: element;
}
