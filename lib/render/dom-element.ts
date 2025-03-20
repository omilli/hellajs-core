import { delegateEvents } from "../events";
import type { HElement } from "../types";

/**
 * Creates a DOM element from a virtual DOM element
 */
export function renderDomElement(
	element: HElement | string,
	container: Element,
): HTMLElement | Text {
	if (typeof element === "string") {
		return document.createTextNode(element);
	}

	const { type, props, children } = element;
	const domElement = document.createElement(type);

	// Clear the container and append the new element
	container.innerHTML = "";
	container.appendChild(domElement);

	// Apply props
	Object.entries(props || {}).forEach(([key, value]) => {
		if (key === "className") {
			domElement.className = value;
		} else if (key === "style" && typeof value === "object") {
			Object.entries(value).forEach(([styleKey, styleValue]) => {
				(domElement.style as any)[styleKey] = styleValue;
			});
		} else if (key.startsWith("on")) {
			// Events will be handled by delegateEvents
		} else if (key !== "_key") {
			if (typeof value === "boolean") {
				// Handle boolean attributes
				if (value) {
					domElement.setAttribute(key, "");
				}
			} else if (value !== null && value !== undefined) {
				domElement.setAttribute(key, String(value));
			}
		}
	});

	// Attach event handlers
	delegateEvents(domElement, props);

	// Append children correctly
	children?.forEach((child) => {
		const childNode = renderDomElement(child, domElement);
		domElement.appendChild(childNode);
	});

	return domElement;
}
