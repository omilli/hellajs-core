import type { Context, RootContext } from "../../context";
import type { HNode } from "../types";
import { diffNode } from "./nodes";
import { renderElement } from "./render";

/**
 * Reconciles differences between actual DOM children and virtual DOM node children.
 * This function is responsible for efficiently updating the DOM to match the virtual representation.
 *
 * The function handles three main cases:
 * 1. If there are more DOM children than virtual children, it removes excess DOM nodes
 * 2. For existing DOM nodes that have a corresponding virtual node, it updates them via diffNode
 * 3. For virtual nodes that don't have a corresponding DOM node, it creates and appends new DOM nodes
 *
 * @param domChildren - Array of actual DOM elements (HTMLElement or Text nodes)
 * @param hNodeChildren - Array of virtual DOM nodes (HNode objects or primitive values like strings/numbers)
 * @param parentElement - The parent DOM element containing the children being diffed
 * @param rootContext - Context object for the component root
 * @param rootSelector - CSS selector string that identifies the root
 * @param context - Additional context information for rendering
 *
 * @remarks
 * The function optimizes DOM operations by batching removals from the end to avoid layout thrashing.
 */
export function diffChildren(
	domChildren: (HTMLElement | Text)[],
	hNodeChildren: (HNode | string | number)[],
	parentElement: Element | DocumentFragment,
	rootContext: RootContext,
	rootSelector: string,
	context: Context,
): void {
	const domLen = domChildren.length;
	const vdomLen = hNodeChildren.length;

	// Handle case where we have more DOM children than virtual children
	// Batch removals by removing from end to avoid layout thrashing
	if (domLen > vdomLen) {
		// Bulk removal is faster than one-by-one
		const removeCount = domLen - vdomLen;
		for (let i = 0; i < removeCount; i++) {
			parentElement.removeChild(parentElement.lastChild!);
		}
		domChildren.length = vdomLen; // Truncate array directly
	}

	// Process each child
	for (let i = 0; i < vdomLen; i++) {
		const hNodeChild = hNodeChildren[i];

		if (i < domLen) {
			// Update existing node
			diffNode(
				domChildren[i],
				hNodeChild,
				parentElement,
				rootContext,
				rootSelector,
				context,
			);
		} else {
			// Add new node
			parentElement.appendChild(
				renderElement(hNodeChild, rootSelector, context),
			);
		}
	}
}
