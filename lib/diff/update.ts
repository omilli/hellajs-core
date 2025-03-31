import type { Context } from "../context";
import { delegateEvents } from "../events";
import type { RenderedElement, VNode } from "../types";
import { generateKey } from "../utils";
import { diffChildren } from "./children";
import { updateProps } from "./props";

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
	const { props = {}, children = [] } = vNode;

	updateProps(element, props);

	const keys = Object.keys(props);
	let hasEventProps = false;

	// check for 'on' prefix using charCodeAt
	for (let i = 0, len = keys.length; i < len; i++) {
		const key = keys[i];
		if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110) {
			hasEventProps = true;
			break;
		}
	}

	if (hasEventProps) {
		element.dataset["eKey"] ??= generateKey();
		delegateEvents(vNode, rootSelector, element.dataset["eKey"]);
	}

	const childCount = element.childNodes.length;
	const domChildren = new Array(childCount);
	for (let i = 0; i < childCount; i++) {
		domChildren[i] = element.childNodes[i] as RenderedElement;
	}

	diffChildren(domChildren, children || [], element, rootSelector, context);

	return element;
}
