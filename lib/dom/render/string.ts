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

	const { type, props, children } = vNode;

	// Handle fragments (when type is undefined or null)
	if (!type) {
		return renderChildren(children);
	}

	const html: string[] = [];
	html.push(`<${type}${handleProps(props)}>`);
	html.push(renderChildren(children));
	html.push(`</${type}>`);

	return html.join("");
}

/**
 * Sets HTML attributes and properties on a DOM element based on a provided props object.
 *
 * @param props - An object containing the properties to apply to the element
 *
 */
function handleProps(props: VNode["props"] = {}) {
	const html: string[] = [];

	propProcessor(props, {
		classProp(className) {
			html.push(` class="${escapeHTML(className)}"`);
		},
		boolProp(key) {
			html.push(` ${key}`);
		},
		regularProp(key, value) {
			html.push(` ${key}="${escapeHTML(String(value))}"`);
		},
	});

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

	// Pre-allocate array for better performance
	const html = new Array(children.length);

	for (let i = 0; i < children.length; i++) {
		html[i] = renderStringElement(children[i]);
	}

	return html.join("");
}
