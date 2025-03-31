import type { Context } from "../../context";
import { RenderedElement } from "../render";
import type { VNode, VNodeValue } from "../types";
import { diffChildren } from "./children";
import { renderElement } from "./render";
import { updateElement } from "./update";

/**
 * Compares and reconciles a real DOM node with a virtual node (VNode) representation.
 * This is the core diffing function that handles different node types and updates the DOM efficiently.
 *
 * @param domNode - The existing DOM node to be updated
 * @param vNode - The virtual node representation to reconcile with
 * @param parentElement - The parent element in the DOM tree where replacements would occur if necessary
 * @param rootSelector - CSS selector string identifying the root element
 * @param context - Current context with scoped state and handlers
 *
 * @returns The updated DOM node (which might be a new node if replacement occurred)
 *
 * @remarks
 * The function handles three main cases:
 * 1. Text nodes (when vNode is a string or number)
 * 2. Fragment nodes (when vNode.type is undefined or null)
 * 3. Regular HTML elements
 *
 * If the node types don't match, the old DOM node is replaced with a new one.
 */
export function diffNode(
	domNode: RenderedElement,
	vNode: VNodeValue,
	parentElement: Element | DocumentFragment,
	rootSelector: string,
	context: Context,
): RenderedElement {
	// Handle text nodes - faster primitive type check
	const vNodeType = typeof vNode;
	if (vNodeType === "string" || vNodeType === "number") {
		return handleText(domNode as Text, vNode as string | number, parentElement);
	}

	const { type, children = [] } = vNode as VNode;

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
				vNode as VNode,
				rootSelector,
				context,
			);
		}
	}

	// Types don't match, create a new element and replace
	const newElement = renderElement(vNode, rootSelector, context);
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
	children: VNode["children"] = [],
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
			domChildren[i] = domNode.childNodes[i] as RenderedElement;
		}

		diffChildren(domChildren, children, domNode, rootSelector, context);
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
 * @param vNode - The hyperscript value (string or number) to use as text content
 * @param parentElement - The parent element containing the DOM node
 * @returns The updated or newly created Text node
 *
 * If the existing node is already a Text node (nodeType === 3), its content will be updated.
 * Otherwise, the node will be replaced with a new Text node in the parent element.
 */
function handleText(
	domNode: Text,
	vNode: string | number,
	parentElement: Element | DocumentFragment,
): Text {
	const nodeType = domNode.nodeType;
	const vNodeStr = String(vNode);

	if (nodeType === 3) {
		// Use direct constant instead of Node.TEXT_NODE
		// Update text content if different
		if (domNode.textContent !== vNodeStr) {
			domNode.textContent = vNodeStr;
		}
		return domNode;
	} else {
		// Replace with a new text node
		const newNode = document.createTextNode(vNodeStr);
		parentElement.replaceChild(newNode, domNode);
		return newNode;
	}
}
