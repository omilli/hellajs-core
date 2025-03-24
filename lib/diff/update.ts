import type { ContextState, RootContext } from "../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { diffChildren } from "./nodes";
import { updateProps } from "./props";

/**
 * Updates an existing element with new props and children
 */
export function updateElement(
	element: HTMLElement,
	hNode: HNode,
	rootContext: RootContext,
	rootSelector: string,
	context: ContextState,
): HTMLElement {
	const props = hNode.props || {};

	// Update props
	updateProps(element, props);

	// Update event handlers - use pre-check to avoid unnecessary work
	const keys = Object.keys(props);
	let hasEventProps = false;

	// Micro-optimization: check for 'on' prefix using charCodeAt instead of startsWith
	for (let i = 0, len = keys.length; i < len; i++) {
		const key = keys[i];
		if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110) {
			// 'o'=111, 'n'=110
			hasEventProps = true;
			break;
		}
	}

	if (hasEventProps) {
		if (!element.dataset.eKey) {
			element.dataset.eKey = generateKey();
		}
		delegateEvents(hNode, rootSelector, element.dataset.eKey);
	}

	// Optimize DOM children collection with pre-allocated array
	const childCount = element.childNodes.length;
	const domChildren = new Array(childCount);
	for (let i = 0; i < childCount; i++) {
		domChildren[i] = element.childNodes[i] as HTMLElement | Text;
	}

	// Update children
	diffChildren(
		domChildren,
		hNode.children || [],
		element,
		rootContext,
		rootSelector,
		context,
	);

	return element;
}
