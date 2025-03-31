import type { Context } from "../context";
import type { VNode } from "../types";
import { processAttributes } from "./attributes";
import { diffChildren } from "./children";

/**
 * Updates a DOM element based on a virtual node representation (VNode).
 *
 * This function modifies the provided DOM element by:
 * 1. Updating its properties
 * 2. Attaching event handlers
 * 3. Processing and updating child elements
 *
 * @param element - The DOM element to update
 * @param vNode - Virtual node representation containing props and children
 * @param rootSelector - CSS selector string identifying the root element
 * @param context - Current context for rendering
 * @returns The updated DOM element
 */
export function updateElement(
	element: HTMLElement,
	vNode: VNode,
	rootSelector: string,
	context: Context,
): HTMLElement {
	// Make sure we have default values for props and children
	// Update the element props
	processAttributes(element, vNode, rootSelector);
	// diff the elements children
	diffChildren(vNode.children || [], element, rootSelector, context);
	return element;
}
