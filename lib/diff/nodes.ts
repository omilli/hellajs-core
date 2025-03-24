import type { ContextState, RootContext } from "../context";
import type { HNode } from "../types";
import { renderNewElement, updateElement } from "./render";

/**
 * Compares an existing DOM node with a new virtual node and updates as needed
 */
export function diffNode(
	domNode: HTMLElement | Text,
	hNode: HNode | string | number,
	parentElement: Element | DocumentFragment,
	rootContext: RootContext,
	rootSelector: string,
	context: ContextState,
): HTMLElement | Text | DocumentFragment {
	// Handle text nodes - faster primitive type check
	const hNodeType = typeof hNode;
	if (hNodeType === "string" || hNodeType === "number") {
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

	const { type, children = [] } = hNode as HNode;

	// Handle fragment (when type is undefined or null)
	if (!type) {
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
				domNode as Element,
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
				fragment.appendChild(
					renderNewElement(children[i], rootSelector, context),
				);
			}

			parentElement.replaceChild(fragment, domNode);
			return fragment;
		}
	}

	// Handle regular elements
	if (domNode.nodeType === 1) {
		// Use direct constant instead of Node.ELEMENT_NODE
		// If node types match, update the element - use direct lowercase comparison when possible
		if ((domNode as HTMLElement).tagName.toLowerCase() === type.toLowerCase()) {
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
	const newElement = renderNewElement(hNode, rootSelector, context);
	parentElement.replaceChild(newElement, domNode);
	return newElement;
}

/**
 * Compares and updates children of an element
 */
export function diffChildren(
	domChildren: (HTMLElement | Text)[],
	hNodeChildren: (HNode | string | number)[],
	parentElement: Element | DocumentFragment,
	rootContext: RootContext,
	rootSelector: string,
	context: ContextState,
): void {
	const domLen = domChildren.length;
	const vdomLen = hNodeChildren.length;

	// Handle case where we have more DOM children than virtual children
	// Batch removals by removing from end to avoid layout thrashing
	if (domLen > vdomLen) {
		// Bulk removal is faster than one-by-one
		const removeCount = domLen - vdomLen;
		for (let i = 0; i < removeCount; i++) {
			parentElement.removeChild(parentElement.lastChild!);
		}
		domChildren.length = vdomLen; // Truncate array directly
	}

	// Process each child
	for (let i = 0; i < vdomLen; i++) {
		const hNodeChild = hNodeChildren[i];

		if (i < domLen) {
			// Update existing node
			diffNode(
				domChildren[i],
				hNodeChild,
				parentElement,
				rootContext,
				rootSelector,
				context,
			);
		} else {
			// Add new node
			parentElement.appendChild(
				renderNewElement(hNodeChild, rootSelector, context),
			);
		}
	}
}
