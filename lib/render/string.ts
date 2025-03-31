import type { VNode } from "../types";
import { propProcessor } from "./props";
import { escapeHTML } from "./utils";

/**
 * Converts an element to its HTML string representation.
 *
 * @param vNode - The element to convert, either an VNode object or a string (text node)
 * @returns The HTML string representation of the element
 */
export function renderStringElement(vNode: VNode | string): string {
	// Handle text nodes
	if (typeof vNode === "string" || typeof vNode === "number") {
		return escapeHTML(String(vNode));
	}

	const { type, props = {}, children } = vNode;

	// Handle fragments (when type is undefined or null)
	if (!type) {
		return renderChildren(children);
	}

	const html: string[] = [];
	// Generate opening tag with props
	// Check for event handlers that will need hydration
	const hasEvents = Object.keys(props).some((key) => key.startsWith("on"));

	propProcessor(props, {
		classProp(className) {
			html.push(`${type} class="${escapeHTML(className)}"`);
		},
		boolProp(key) {
			html.push(`${type} ${key}`);
		},
		regularProp(key, value) {
			html.push(`${type} ${key}="${escapeHTML(String(value))}"`);
		},
	});

	// Add data-e-key attribute to elements with event handlers
	if (hasEvents) {
		const eKey = `e${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
		html.push(` data-e-key="${eKey}"`);
	}
	// Generate children content
	html.push(renderChildren(children));
	// Generate closing tag
	html.push(`</${type}>`);

	return html.join("");
}

/**
 * Renders an array of child nodes into an HTML string.
 *
 * @param children - The array of child nodes to render. Defaults to an empty array.
 * @returns A string containing the HTML representation of all child nodes concatenated together.
 *          Returns an empty string if children is falsy or empty.
 */
function renderChildren(children: VNode["children"] = []) {
	if (!children || children.length === 0) return "";

	const html = new Array(children.length);

	for (let i = 0; i < children.length; i++) {
		html[i] = renderStringElement(children[i]);
	}

	return html.join("");
}
