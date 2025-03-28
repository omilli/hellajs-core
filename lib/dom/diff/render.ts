import type { Context } from "../../context";
import { delegateEvents } from "../events";
import type { HNode } from "../types";
import { generateKey } from "../utils";
import { updateProps } from "./props";


/**
 * Renders a hierarchical node (HNode) or primitive value into a DOM element.
 * 
 * This function converts virtual DOM nodes into actual DOM elements. It handles
 * different types of nodes:
 * - Strings and numbers are converted to text nodes
 * - HNodes without a type are treated as fragments
 * - HNodes with a type are converted to HTML elements with their respective properties,
 *   event handlers, and children
 * 
 * @param hNode - The node to render, can be an HNode object or a primitive (string/number)
 * @param rootSelector - CSS selector string identifying the root container
 * @param context - Application context for rendering
 * @returns The created DOM element, text node, or document fragment
 */
export function renderElement(
	hNode: HNode | string | number,
	rootSelector: string,
	context: Context,
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

/**
 * Creates a DocumentFragment containing rendered elements from an array of children.
 * 
 * @param children - An array of hierarchical nodes to be rendered. Defaults to an empty array.
 * @param rootSelector - The CSS selector string representing the root element.
 * @param context - The rendering context containing state and configuration.
 * @returns A DocumentFragment containing all rendered child elements.
 */
function handleFragment(
	children: HNode["children"] = [],
	rootSelector: string,
	context: Context,
): DocumentFragment {
	const fragment = document.createDocumentFragment();
	const len = children.length;

	// Use for loop instead of forEach for better performance
	for (let i = 0; i < len; i++) {
		fragment.appendChild(renderElement(children[i], rootSelector, context));
	}

	return fragment;
}

/**
 * Handles event properties for a virtual node and sets up event delegation.
 * This function checks if the provided virtual node has any properties that
 * start with "on" (e.g., onClick, onMouseOver), and if so, sets a unique
 * event key on the element and delegates event handling.
 * 
 * @param hNode - The virtual node containing properties to check for event handlers
 * @param element - The DOM element to attach the event key to
 * @param rootSelector - CSS selector for the root element used in event delegation
 */
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
		element.dataset["eKey"] = generateKey();
		delegateEvents(hNode as HNode, rootSelector, element.dataset["eKey"]);
	}
}

/**
 * Handles the appending of child nodes to a parent element.
 * 
 * @param children - The array of child nodes to be rendered and appended. Defaults to an empty array.
 * @param element - The parent HTML element to which the rendered children will be appended.
 * @param rootSelector - A CSS selector string identifying the root element.
 * @param context - The context object containing rendering state and configuration.
 * 
 * @remarks
 * This function iterates through each child in the provided children array,
 * renders it using the renderElement function, and appends the resulting
 * DOM node to the parent element.
 */
function handleChildren(
	children: HNode["children"] = [],
	element: HTMLElement,
	rootSelector: string,
	context: Context,
) {
	const childLen = children.length;

	for (let i = 0; i < childLen; i++) {
		element.appendChild(renderElement(children[i], rootSelector, context));
	}
}
