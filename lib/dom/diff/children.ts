import { type Context, getRootContext } from "../../context";
import { cleanupEventHandlers } from "../events";
import type { VNodeValue } from "../types";
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
	domChildren: (HTMLElement | Text)[],
	vNodeChildren: VNodeValue[],
	parentElement: Element | DocumentFragment,
	rootSelector: string,
	context: Context,
): void {
	const domLen = domChildren.length;
	const vdomLen = vNodeChildren.length;
	const rootContext = getRootContext(rootSelector, context);

	// Handle case where we have more DOM children than virtual children
	// Batch removals by removing from end to avoid layout thrashing
	if (domLen > vdomLen) {
		// Bulk removal is faster than one-by-one
		const removeCount = domLen - vdomLen;
		for (let i = 0; i < removeCount; i++) {
			const nodeToRemove = domChildren[domLen - 1 - i];
			cleanupEventHandlers(nodeToRemove, rootContext);
			parentElement.removeChild(nodeToRemove);
		}
		domChildren.length = vdomLen; // Truncate array directly
	}

	// Process each child
	for (let i = 0; i < vdomLen; i++) {
		const vNodeChild = vNodeChildren[i];

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
