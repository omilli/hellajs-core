import { type Context, getRootContext } from "../context";
import { cleanupEventHandlers } from "../events";
import type { RenderedElement, VNodeValue } from "../types";
import { diffNode } from "./nodes";
import { renderElement } from "./render";

/**
 * Reconciles differences between actual DOM children and virtual DOM node children.
 * The function handles three main cases:
 * 1. If there are more DOM children than virtual children, it removes excess DOM nodes
 * 2. For existing DOM nodes that have a corresponding virtual node, it updates them
 * 3. For virtual nodes that don't have a corresponding DOM node, it creates and appends new DOM nodes
 *
 * @param domChildren - Array of actual DOM elements (HTMLElement or Text nodes)
 * @param vNodeChildren - Array of virtual DOM nodes (VNode objects or primitive values like strings/numbers)
 * @param parentElement - The parent DOM element containing the children being diffed
 * @param rootSelector - CSS selector string that identifies the root element
 * @param context - Additional context information for rendering
 *
 * @remarks
 * The function optimizes DOM operations by batching removals from the end to avoid layout thrashing.
 */
export function diffChildren(
	vNodeChildren: VNodeValue[],
	parentElement: Element | DocumentFragment,
	rootSelector: string,
	context: Context,
): void {
	// Count the number of child nodes
	const childCount = parentElement.childNodes.length;
	// Prepopulate the array with the child nodes length
	const domChildren = new Array(childCount);
	for (let i = 0; i < childCount; i++) {
		domChildren[i] = parentElement.childNodes[i] as RenderedElement;
	}
	// Count the amount of children in the DOM
	const domLen = domChildren.length;
	// Count the amount of children in the virtual node
	const vdomLen = vNodeChildren.length;
	// Handle case where we have more DOM children than virtual children
	if (domLen > vdomLen) {
		// Get the root context for event cleanup
		const rootContext = getRootContext(rootSelector, context);
		// Count the number of nodes to remove
		const removeCount = domLen - vdomLen;
		// Count down from the end of the DOM children
		for (let i = domLen - 1; i >= domLen - removeCount; i--) {
			// Get the node to remove
			const nodeToRemove = domChildren[i];
			// Clean up event handlers for the node
			cleanupEventHandlers(nodeToRemove, rootContext);
			// Remove the node from the parent element
			parentElement.removeChild(nodeToRemove);
		}
	}
	// Process each child
	for (let i = 0; i < vdomLen; i++) {
		// Get the virtual node child
		const vNodeChild = vNodeChildren[i];
		// If there are still nodes to process
		if (i < domLen) {
			// Update existing node
			diffNode(
				domChildren[i],
				vNodeChild,
				parentElement,
				rootSelector,
				context,
			);
		} else {
			// Add new node
			parentElement.appendChild(
				renderElement(vNodeChild, rootSelector, context),
			);
		}
	}
}
