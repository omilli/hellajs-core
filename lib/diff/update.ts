import type { Context } from "../context";
import { delegateEvents } from "../events";
import type { VNode } from "../types";
import { generateKey } from "../utils";
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
	const { props = {}, children = [] } = vNode;
	// Update the element props
	processAttributes(element, props);
	// Get all the prop keys
	const keys = Object.keys(props);
	// Default has events to false
	let hasEventProps = false;
	// Check each key to see if it starts with "on"
	for (let i = 0, len = keys.length; i < len; i++) {
		// Get the current key
		const key = keys[i];
		// Check if the key starts with "on"
		if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110) {
			// Break here beacuse we only need one event prop to be true
			hasEventProps = true;
			break;
		}
	}
	// If we have event props, we need to delegate the events
	if (hasEventProps) {
		// Set the event key on the element if it doesn't exist
		element.dataset.eKey ??= generateKey();
		// Delegate the events to the root element
		delegateEvents(vNode, rootSelector, element.dataset.eKey);
	}
	// diff the elements children
	diffChildren(children, element, rootSelector, context);
	return element;
}
