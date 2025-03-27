import type { Context, RootContext } from "../../context";
import type { HNode } from "../types";
import { diffChildren } from "./children";
import { renderElement } from "./render";
import { updateElement } from "./update";

/**
 * Compares an existing DOM node with a new virtual node and updates as needed
 */
export function diffNode(
	domNode: HTMLElement | DocumentFragment | Text,
	hNode: HNode | string | number,
	parentElement: Element | DocumentFragment,
	rootContext: RootContext,
	rootSelector: string,
	context: Context,
): HTMLElement | Text | DocumentFragment {
	// Handle text nodes - faster primitive type check
	const hNodeType = typeof hNode;
	if (hNodeType === "string" || hNodeType === "number") {
		return handleText(domNode as Text, hNode as string | number, parentElement);
	}

	const { type, children = [] } = hNode as HNode;

	// Handle fragment (when type is undefined or null)
	if (!type) {
		return handleFragment(
			domNode as DocumentFragment,
			children,
			rootSelector,
			parentElement,
			rootContext,
			context,
		);
	}

	// Handle regular elements
	if (domNode.nodeType === 1) {
		// If node types match, update the element - use direct lowercase comparison when possible
		const isMatch =
			(domNode as HTMLElement).tagName.toLowerCase() === type.toLowerCase();
		if (isMatch) {
			return updateElement(
				domNode as HTMLElement,
				hNode as HNode,
				rootContext,
				rootSelector,
				context,
			);
		}
	}

	// Types don't match, create a new element and replace
	const newElement = renderElement(hNode, rootSelector, context);
	parentElement.replaceChild(newElement, domNode);
	return newElement;
}

function handleFragment(
	domNode: DocumentFragment,
	children: HNode["children"] = [],
	rootSelector: string,
	parentElement: Element | DocumentFragment,
	rootContext: RootContext,
	context: Context,
) {
	if (domNode.nodeType === 11) {
		// Use direct constant (DocumentFragment)
		// Update fragment contents - optimize array creation
		const childCount = domNode.childNodes.length;
		const domChildren = new Array(childCount);
		for (let i = 0; i < childCount; i++) {
			domChildren[i] = domNode.childNodes[i] as HTMLElement | Text;
		}

		diffChildren(
			domChildren,
			children,
			domNode,
			rootContext,
			rootSelector,
			context,
		);
		return domNode;
	} else {
		// Replace with a fragment - use document fragment for batch operation
		const fragment = document.createDocumentFragment();
		const len = children.length;

		for (let i = 0; i < len; i++) {
			fragment.appendChild(renderElement(children[i], rootSelector, context));
		}

		parentElement.replaceChild(fragment, domNode);
		return fragment;
	}
}

function handleText(
	domNode: Text,
	hNode: string | number,
	parentElement: Element | DocumentFragment,
): Text {
	const nodeType = domNode.nodeType;
	const hNodeStr = String(hNode);

	if (nodeType === 3) {
		// Use direct constant instead of Node.TEXT_NODE
		// Update text content if different
		if (domNode.textContent !== hNodeStr) {
			domNode.textContent = hNodeStr;
		}
		return domNode;
	} else {
		// Replace with a new text node
		const newNode = document.createTextNode(hNodeStr);
		parentElement.replaceChild(newNode, domNode);
		return newNode;
	}
}
