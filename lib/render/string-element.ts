import type { HElement } from "../types";
import { escapeHTML } from "./utils";


/**
 * Converts an element to its HTML string representation.
 *
 * @param element - The element to convert, either an HElement object or a string (text node)
 * @returns The HTML string representation of the element
 */
export function renderStringElement(element: HElement | string): string {
	// Handle text nodes
	if (typeof element === "string") {
		return escapeHTML(element);
	}

	const { type, props, children } = element;
	let html = `<${type}`;

	// Process attributes
	Object.entries(props || {}).forEach(([key, value]) => {
		if (key === "className") {
			html += ` class="${escapeHTML(value)}"`;
		} else if (key === "style" && typeof value === "object") {
			const styleString = Object.entries(value)
				.map(([styleKey, styleValue]) => {
					// Convert camelCase to kebab-case: backgroundColor -> background-color
					const kebabKey = styleKey.replace(/([A-Z])/g, "-$1").toLowerCase();
					return `${kebabKey}:${styleValue}`;
				})
				.join(";");
			html += ` style="${escapeHTML(styleString)}"`;
		} else if (typeof value === "boolean") {
			// Handle boolean attributes like disabled, checked
			if (value) {
				html += ` ${key}`;
			}
		} else {
			html += ` ${key}="${escapeHTML(String(value))}"`;
		}
	});

	html += ">";

	// Process children
	if (children && children.length > 0) {
		children.forEach((child) => {
			html += renderStringElement(child);
		});
	}

	// Close the tag
	html += `</${type}>`;
	return html;
}
