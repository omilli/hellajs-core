import type { Context } from "../../context";
import type { HNode } from "../types";
import { diffChildren } from "./children";
import { renderElement } from "./render";
import { updateElement } from "./update";

/**
 * Compares and reconciles a real DOM node with a virtual node (HNode) representation.
 * This is the core diffing function that handles different node types and updates the DOM efficiently.
 *
 * @param domNode - The existing DOM node to be updated
 * @param hNode - The virtual node representation to reconcile with
 * @param parentElement - The parent element in the DOM tree where replacements would occur if necessary
 * @param rootSelector - CSS selector string identifying the root element
 * @param context - Current context with scoped state and handlers
 *
 * @returns The updated DOM node (which might be a new node if replacement occurred)
 *
 * @remarks
 * The function handles three main cases:
 * 1. Text nodes (when hNode is a string or number)
 * 2. Fragment nodes (when hNode.type is undefined or null)
 * 3. Regular HTML elements
 *
 * If the node types don't match, the old DOM node is replaced with a new one.
 */
export function diffNode(
	domNode: HTMLElement | DocumentFragment | Text,
	hNode: HNode | string | number,
	parentElement: Element | DocumentFragment,
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

/**
 * Handles the rendering and diffing of DocumentFragment nodes in the virtual DOM.
 *
 * This function has two modes of operation:
 * 1. If the provided node is already a DocumentFragment (nodeType === 11), it efficiently updates its contents
 *    by diffing the current children with the new virtual node children.
 * 2. If the provided node is not a DocumentFragment, it creates a new DocumentFragment, renders the children
 *    into it, and replaces the original node in the parent element.
 *
 * @param domNode - The DOM node to update or replace
 * @param children - Virtual node children to render into the fragment
 * @param rootSelector - Selector string identifying the root element
 * @param parentElement - Parent element containing the domNode
 * @param context - Current rendering context
 * @returns The resulting DocumentFragment (either updated or newly created)
 */
function handleFragment(
	domNode: DocumentFragment,
	children: HNode["children"] = [],
	rootSelector: string,
	parentElement: Element | DocumentFragment,
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

/**
 * Updates or replaces a DOM node with text content based on a hyperscript value.
 *
 * @param domNode - The existing DOM Text node to update or replace
 * @param hNode - The hyperscript value (string or number) to use as text content
 * @param parentElement - The parent element containing the DOM node
 * @returns The updated or newly created Text node
 *
 * If the existing node is already a Text node (nodeType === 3), its content will be updated.
 * Otherwise, the node will be replaced with a new Text node in the parent element.
 */
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
