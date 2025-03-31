import type { Context } from "../context";
import { renderElement } from "../render/element";
import { renderFragment } from "../render/fragment";
import type { RenderedElement, VNode, VNodeValue } from "../types";
import { castToString, isValidTextNode } from "../utils";
import { diffChildren } from "./children";
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
	const { nodeType, textContent } = domNode;
	// Handle text nodes
	if (isValidTextNode(vNode)) {
		// Cast to string if not string
		const text = castToString(vNode);
		// Check if the node is a text node
		if (nodeType === 3) {
			// Update text content if different
			if (textContent !== text) {
				domNode.textContent = text;
			}
			return domNode;
		}
		// Create a new text node
		const newNode = document.createTextNode(text);
		// Replace with a new text node
		parentElement.replaceChild(newNode, domNode);
		return newNode;
	}
	// vNode should be a VNode object at this point
	const { type, children = [] } = vNode as VNode;
	// Handle fragment (when type is undefined or null)
	if (!type) {
		if (nodeType === 11) {
			// Perform diffing on the children
			diffChildren(
				children,
				domNode as DocumentFragment,
				rootSelector,
				context,
			);
			return domNode;
		}
		// Replace with a fragment - use document fragment for batch operation
		const fragment = renderFragment(children, rootSelector, context);
		// Replace the existing node with the new fragment
		parentElement.replaceChild(fragment, domNode);
		return fragment;
	}
	// Handle regular elements
	if (nodeType === 1) {
		// If node types match (use direct lowercase comparison)
		const isMatch =
			(domNode as HTMLElement).tagName.toLowerCase() === type.toLowerCase();
		if (isMatch) {
			// Update the existing element
			return updateElement(
				domNode as HTMLElement,
				vNode as VNode,
				rootSelector,
				context,
			);
		}
	}
	// Types don't match, create a new element
	const newElement = renderElement(vNode, rootSelector, context);
	// And replace the old node with the new one
	parentElement.replaceChild(newElement, domNode);
	return newElement;
}
