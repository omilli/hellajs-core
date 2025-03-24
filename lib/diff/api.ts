import { getDefaultContext, getRootContext } from "../context";
import { getRootElement } from "../render";
import type { HNode } from "../types";
import { diffChildren } from "./nodes";
import { renderElement } from "./render";
import type { DiffConfig } from "./types";

/**
 * Main diffing function that compares a new virtual DOM tree with the existing DOM
 * and performs minimal updates to bring the DOM in sync with the virtual DOM
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

function handleChildren({
	hNode,
	rootSelector,
	rootElement,
	context,
}: DiffConfig) {
	const rootContext = getRootContext(rootSelector, context);
	const childLength = rootElement.childNodes.length;
	const children = new Array(childLength);
	for (let i = 0; i < childLength; i++) {
		children[i] = rootElement.childNodes[i] as HTMLElement | Text;
	}

	diffChildren(
		children,
		[hNode],
		rootElement,
		rootContext,
		rootSelector,
		context,
	);

	return rootElement as HTMLElement;
}

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
