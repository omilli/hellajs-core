import type { ContextState, RootContext } from "../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { diffChildren } from "./nodes";
import { updateProps } from "./props";

/**
 * Creates a new DOM element for a virtual node
 */
export function renderNewElement(
	hNode: HNode | string | number,
	rootSelector: string,
	context: ContextState,
): HTMLElement | Text | DocumentFragment {
	const hNodeType = typeof hNode;
	if (hNodeType === "string" || hNodeType === "number") {
		return document.createTextNode(String(hNode));
	}

	const { type, props = {}, children = [] } = hNode as HNode;

	if (!(hNode as HNode).type) {
		const fragment = document.createDocumentFragment();
		const len = children.length;

		// Use for loop instead of forEach for better performance
		for (let i = 0; i < len; i++) {
			fragment.appendChild(
				renderNewElement(children[i], rootSelector, context),
			);
		}
		return fragment;
	}

	const element = document.createElement(type as string);

	// Apply props
	updateProps(element, props);

	// Set up event handlers - use same optimization as in updateElement
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
		delegateEvents(hNode as HNode, rootSelector, element.dataset.eKey);
	}

	// Process children - use for loop instead of forEach
	const childLen = children.length;

	for (let i = 0; i < childLen; i++) {
		element.appendChild(renderNewElement(children[i], rootSelector, context));
	}

	return element;
}

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
