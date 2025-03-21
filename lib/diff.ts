import type { ContextState, RootContext } from "./context";
import { getDefaultContext, getRootContext } from "./context";
import { delegateEvents } from "./events";
import { propProcessor } from "./render";
import type { HNode } from "./types";
import { generateKey } from "./utils";

/**
 * Main diffing function that compares a new virtual DOM tree with the existing DOM
 * and performs minimal updates to bring the DOM in sync with the virtual DOM
 */
export function diff(
	newHNode: HNode,
	rootSelector: string,
	context = getDefaultContext(),
): HTMLElement | Text | DocumentFragment {
	// Cache selector results when possible
	const rootElement = document.querySelector(rootSelector);
	if (!rootElement) {
		throw new Error(`Root element not found: ${rootSelector}`);
	}

	const rootContext = getRootContext(rootSelector, context);

	// Instead of recreating everything, diff the children of the root
	if (rootElement.childNodes.length === 0) {
		// First render case - just create and append
		const newElement = renderNewElement(newHNode, rootSelector, context);
		rootElement.appendChild(newElement);
		return newElement instanceof DocumentFragment
			? (rootElement as HTMLElement)
			: newElement;
	} else {
		// Use direct property access instead of creating a new array
		const childCount = rootElement.childNodes.length;
		const domChildren = new Array(childCount);
		for (let i = 0; i < childCount; i++) {
			domChildren[i] = rootElement.childNodes[i] as HTMLElement | Text;
		}

		diffChildren(
			domChildren,
			[newHNode],
			rootElement,
			rootContext,
			rootSelector,
			context,
		);
		return rootElement as HTMLElement;
	}
}

/**
 * Compares an existing DOM node with a new virtual node and updates as needed
 */
function diffNode(
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
 * Updates an existing element with new props and children
 */
function updateElement(
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

/**
 * Compares and updates children of an element
 */
function diffChildren(
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

/**
 * Updates the props/attributes of an element
 */
function updateProps(element: HTMLElement, props: HNode["props"] = {}): void {
	// Use a more efficient Set-based approach for attributes
	const attrsToRemove = new Set<string>();
	const attrs = element.attributes;
	const attrLen = attrs.length;

	// Collect current attributes - use direct comparisons instead of startsWith
	for (let i = 0; i < attrLen; i++) {
		const attr = attrs[i];
		const name = attr.name;
		// Check if name starts with 'data-' without using startsWith
		if (
			!(
				name.charCodeAt(0) === 100 &&
				name.charCodeAt(1) === 97 &&
				name.charCodeAt(2) === 116 &&
				name.charCodeAt(3) === 97 &&
				name.charCodeAt(4) === 45
			) &&
			name !== "class"
		) {
			attrsToRemove.add(name);
		}
	}

	// Apply new props
	propProcessor(props, {
		classProp(className) {
			if (element.className !== className) {
				element.className = className;
			}
		},
		boolProp(key) {
			attrsToRemove.delete(key);
			if (!element.hasAttribute(key)) {
				element.setAttribute(key, "");
			}
		},
		regularProp(key, value) {
			attrsToRemove.delete(key);
			const strValue = String(value);
			if (element.getAttribute(key) !== strValue) {
				element.setAttribute(key, strValue);
			}
		},
	});

	// Remove attributes in bulk if possible
	attrsToRemove.forEach((attr) => {
		// Check if starts with 'on' without using startsWith
		if (!(attr.charCodeAt(0) === 111 && attr.charCodeAt(1) === 110)) {
			element.removeAttribute(attr);
		}
	});
}

/**
 * Creates a new DOM element for a virtual node
 */
function renderNewElement(
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
