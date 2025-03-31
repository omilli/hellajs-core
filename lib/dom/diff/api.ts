import { getDefaultContext } from "../../context";
import type { HNode } from "../types";
import { getRootElement } from "../utils";
import { diffChildren } from "./children";
import { renderElement } from "./render";
import type { DiffConfig } from "./types";

/**
 * Updates an existing DOM tree with changes from a virtual DOM node.
 * This is the main entry point for the virtual DOM diffing algorithm.
 *
 * When the root element already has children, it performs an intelligent diff
 * to minimize DOM operations. Otherwise, it performs a fresh render.
 *
 * @param hNode - The virtual DOM node representing the new state
 * @param rootSelector - CSS selector string identifying where to mount the DOM
 * @param context - Optional context object with reactivity settings (uses default if not provided)
 * @returns The resulting DOM element, text node, or document fragment
 */
export function diff(
	hNode: HNode,
	rootSelector: string,
	context = getDefaultContext(),
): HTMLElement | Text | DocumentFragment {
	const rootElement = getRootElement(rootSelector);

	const hasChildren = rootElement.childNodes.length > 0;
	const diffConfig: DiffConfig = {
		hNode,
		rootSelector,
		rootElement,
		context,
	};

	if (hasChildren) {
		return handleChildren(diffConfig);
	} else {
		return handleChildess(diffConfig);
	}
}

/**
 * Handles diffing when the root element already has children.
 * This efficiently updates existing DOM nodes instead of recreating them.
 *
 * @param diffConfig - Configuration object containing the virtual node, root element, and context
 * @returns The updated root element after diffing
 */
function handleChildren({
	hNode,
	rootSelector,
	rootElement,
	context,
}: DiffConfig) {
	const childLength = rootElement.childNodes.length;
	const children = new Array(childLength);
	for (let i = 0; i < childLength; i++) {
		children[i] = rootElement.childNodes[i] as HTMLElement | Text;
	}

	diffChildren(
		children,
		[hNode],
		rootElement,
		rootSelector,
		context,
	);

	return rootElement as HTMLElement;
}

/**
 * Handles diffing when the root element has no children.
 * This performs a fresh render and appends the new elements to the root.
 *
 * @param diffConfig - Configuration object containing the virtual node, root element, and context
 * @returns The newly created element or the root element for fragments
 */
function handleChildess({
	hNode,
	rootSelector,
	rootElement,
	context,
}: DiffConfig) {
	const element = renderElement(hNode, rootSelector, context);
	rootElement.appendChild(element);
	return element instanceof DocumentFragment
		? (rootElement as HTMLElement)
		: element;
}
