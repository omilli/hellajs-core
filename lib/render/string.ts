import type { HNode } from "../types";
import { escapeHTML, propHandler } from "./utils";

/**
 * Converts an element to its HTML string representation.
 *
 * @param hNode - The element to convert, either an HNode object or a string (text node)
 * @returns The HTML string representation of the element
 */
export function renderStringElement(
	hNode: HNode | string,
): string {
	// Handle text nodes
	if (typeof hNode === "string") {
		return escapeHTML(hNode);
	}

	const { type, props, children } = hNode;

	// Handle fragments (when type is undefined or null)
	if (!type) {
		return handleChildren(children);
	}

	return `<${type}${handleProps(props)}>${handleChildren(children)}</${type}>`;
}

/**
 * Sets HTML attributes and properties on a DOM element based on a provided props object.
 *
 * @param element - The HTML element to apply attributes and properties to
 * @param props - An object containing the properties to apply to the element
 *
 */
function handleProps(props: HNode["props"] = {}) {
	let html = ``;

	propHandler(props, {
		classProp(className) {
			html += ` class="${escapeHTML(className)}"`;
		},
		boolProp(key) {
			html += ` ${key}`;
		},
		regularProp(key, value) {
			html += ` ${key}="${escapeHTML(String(value))}"`;
		},
	});

	return html;
}

/**
 * Appends rendered child elements to the specified DOM element.
 *
 * @param element - The parent HTML element to append children to
 * @param children - Array of child elements to be rendered and appended
 */
function handleChildren(children: HNode["children"] = []) {
	let html = "";

	children.forEach((child) => {
		html += renderStringElement(child);
	});

	return html;
}
