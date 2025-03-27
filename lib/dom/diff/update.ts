import type { Context, RootContext } from "../../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { diffChildren } from "./children";
import { updateProps } from "./props";

/**
 * Updates an existing element with new props and children
 */
export function updateElement(
	element: HTMLElement,
	hNode: HNode,
	rootContext: RootContext,
	rootSelector: string,
	context: Context,
): HTMLElement {
	const { props = {}, children = [] } = hNode;

	updateProps(element, props);

	handleEvents(hNode, element, rootSelector);

	handleChildren(children, element, rootSelector, context, rootContext);

	return element;
}

function handleEvents(
	hNode: HNode,
	element: HTMLElement,
	rootSelector: string,
) {
	const { props = {} } = hNode;

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
		element.dataset['eKey'] ??= generateKey();
		delegateEvents(hNode, rootSelector, element.dataset['eKey']);
	}
}

function handleChildren(
	children: HNode["children"] = [],
	element: HTMLElement,
	rootSelector: string,
	context: Context,
	rootContext: RootContext,
) {
	const childCount = element.childNodes.length;
	const domChildren = new Array(childCount);
	for (let i = 0; i < childCount; i++) {
		domChildren[i] = element.childNodes[i] as HTMLElement | Text;
	}

	diffChildren(
		domChildren,
		children || [],
		element,
		rootContext,
		rootSelector,
		context,
	);
}
