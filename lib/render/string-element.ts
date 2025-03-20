import type { HellaElement } from "../types";
import { escapeHTML, propHandler } from "./utils";

/**
 * Converts an element to its HTML string representation.
 *
 * @param element - The element to convert, either an HellaElement object or a string (text node)
 * @returns The HTML string representation of the element
 */
export function renderStringElement(element: HellaElement | string): string {
	// Handle text nodes
	if (typeof element === "string") {
		return escapeHTML(element);
	}

	const { type, props, children } = element;

	return `<${type}${handleProps(props)}>${handleChildren(children)}</${type}>`;
}

/**
 * Sets HTML attributes and properties on a DOM element based on a provided props object.
 *
 * @param domElement - The HTML element to apply attributes and properties to
 * @param props - An object containing the properties to apply to the element
 *
 */
function handleProps(props: HellaElement["props"] = {}) {
	let html = ``;

	propHandler(props, {
		classProp: (className) => {
			html += ` class="${escapeHTML(className)}"`;
		},
		boolProp: (key) => {
			html += ` ${key}`;
		},
		regularProp: (key, value) => {
			html += ` ${key}="${escapeHTML(String(value))}"`;
		},
	});

	return html;
}

/**
 * Appends rendered child elements to the specified DOM element.
 *
 * @param domElement - The parent HTML element to append children to
 * @param children - Array of child elements to be rendered and appended
 */
function handleChildren(children: HellaElement["children"] = []) {
	let html = "";
	// Process children
	if (children && children.length > 0) {
		children.forEach((child) => {
			html += renderStringElement(child);
		});
	}

	return html;
}
