import type { HNode } from "../types";
import { escapeHTML, propHandler } from "./utils";

/**
 * Converts an element to its HTML string representation.
 *
 * @param hNode - The element to convert, either an HNode object or a string (text node)
 * @returns The HTML string representation of the element
 */
export function renderStringElement(hNode: HNode | string): string {
	// Handle text nodes
	if (typeof hNode === "string" || typeof hNode === "number") {
		return escapeHTML(String(hNode));
	}

	const { type, props, children } = hNode;

	// Handle fragments (when type is undefined or null)
	if (!type) {
		return handleChildren(children);
	}

	const html: string[] = [];
	html.push(`<${type}${handleProps(props)}>`);
	html.push(handleChildren(children));
	html.push(`</${type}>`);

	return html.join("");
}

/**
 * Sets HTML attributes and properties on a DOM element based on a provided props object.
 *
 * @param element - The HTML element to apply attributes and properties to
 * @param props - An object containing the properties to apply to the element
 *
 */
function handleProps(props: HNode["props"] = {}) {
	const html: string[] = [];

	propHandler(props, {
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
 * Appends rendered child elements to the specified DOM element.
 *
 * @param element - The parent HTML element to append children to
 * @param children - Array of child elements to be rendered and appended
 */
function handleChildren(children: HNode["children"] = []) {
	if (!children || children.length === 0) return "";

	// Pre-allocate array for better performance
	const html = new Array(children.length);

	for (let i = 0; i < children.length; i++) {
		html[i] = renderStringElement(children[i]);
	}

	return html.join("");
}
