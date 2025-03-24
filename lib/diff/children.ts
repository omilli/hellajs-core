import { type RootContext, getDefaultContext } from "../context";
import type { HNode } from "../types";
import { diffNode } from "./nodes";
import { renderElement } from "./render";

/**
 * Compares and updates children of an element
 */
export function diffChildren(
	domChildren: (HTMLElement | Text)[],
	hNodeChildren: (HNode | string | number)[],
	parentElement: Element | DocumentFragment,
	rootContext: RootContext,
	rootSelector: string,
	context = getDefaultContext(),
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
