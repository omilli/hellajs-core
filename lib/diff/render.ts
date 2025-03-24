import { type ContextState } from "../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { updateProps } from "./props";

/**
 * Creates a new DOM element for a virtual node
 */
export function renderElement(
	hNode: HNode | string | number,
	rootSelector: string,
	context: ContextState,
): HTMLElement | Text | DocumentFragment {
	const hNodeType = typeof hNode;
	if (hNodeType === "string" || hNodeType === "number") {
		return document.createTextNode(String(hNode));
	}

	const { type, props = {}, children = [] } = hNode as HNode;

	if (!type) {
		return handleFragment(children, rootSelector, context);
	}

	const element = document.createElement(type);

	updateProps(element, props);

	handleEvents(hNode as HNode, element, rootSelector);

	handleChildren(children, element, rootSelector, context);

	return element;
}

function handleFragment(
	children: HNode["children"] = [],
	rootSelector: string,
	context: ContextState,
): DocumentFragment {
	const fragment = document.createDocumentFragment();
	const len = children.length;

	// Use for loop instead of forEach for better performance
	for (let i = 0; i < len; i++) {
		fragment.appendChild(renderElement(children[i], rootSelector, context));
	}

	return fragment;
}

function handleEvents(
	hNode: HNode,
	element: HTMLElement,
	rootSelector: string,
) {
	const { props = {} } = hNode;
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
}

function handleChildren(
	children: HNode["children"] = [],
	element: HTMLElement,
	rootSelector: string,
	context: ContextState,
) {
	const childLen = children.length;

	for (let i = 0; i < childLen; i++) {
		element.appendChild(renderElement(children[i], rootSelector, context));
	}
}
