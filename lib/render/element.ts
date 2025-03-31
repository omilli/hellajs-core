import type { Context } from "../context";
import { processAttributes } from "../diff/attributes";
import { delegateEvents } from "../events";
import type { RenderedElement, VNode, VNodeValue } from "../types";
import { castToString, generateKey, isValidTextNode } from "../utils";
import { renderFragment } from "./fragment";

/**
 * Renders a hierarchical node (VNode) or primitive value into a DOM element.
 *
 * This function converts virtual DOM nodes into actual DOM elements. It handles
 * different types of nodes:
 * - Strings and numbers are converted to text nodes
 * - VNodes without a type are treated as fragments
 * - VNodes with a type are converted to HTML elements with their respective properties,
 *   event handlers, and children
 *
 * @param vNode - The node to render, can be an VNode object or a primitive (string/number)
 * @param rootSelector - CSS selector string identifying the root container
 * @param context - Application context for rendering
 * @returns The created DOM element, text node, or document fragment
 */
export function renderElement(
	vNode: VNodeValue,
	rootSelector: string,
	context: Context,
): RenderedElement {
	// Return text node for valid text vNodes
	if (isValidTextNode(vNode)) {
		return document.createTextNode(castToString(vNode));
	}
	// vNode should be a VNode object at this point
	const { type, props = {}, children = [] } = vNode as VNode;
	// Handle fragments  (when type is undefined or null)
	if (!type) {
		return renderFragment(children, rootSelector, context);
	}
	// Create the element dfrom the vNode type
	const element = document.createElement(type);
	// Updafe the element props
	processAttributes(element, props);

	const keys = Object.keys(props);
	let hasEventProps = false;

	for (let i = 0, len = keys.length; i < len; i++) {
		const key = keys[i];
		if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110) {
			// 'o'=111, 'n'=110
			hasEventProps = true;
			break;
		}
	}

	if (hasEventProps) {
		element.dataset.eKey = generateKey();
		delegateEvents(vNode as VNode, rootSelector, element.dataset.eKey);
	}

	const childLen = children.length;

	for (let i = 0; i < childLen; i++) {
		element.appendChild(renderElement(children[i], rootSelector, context));
	}

	return element;
}
