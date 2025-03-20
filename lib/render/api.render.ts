import type { HellaElement, RenderedComponent } from "../types";
import { renderDomElement } from "./dom-element";
import { renderStringElement } from "./string-element";

/**
 * Renders an HellaElement to either a string (server environment) or the DOM (client environment).
 *
 * @param element - The element to be rendered
 * @param container - Optional target container. Can be a DOM Element or a CSS selector string.
 * @returns A string in server environments or a RenderedComponent instance in client environments
 * @throws Error when container element is not found in client environment
 */
export function render(
	element: HellaElement,
	container?: Element | string,
): string | RenderedComponent {
	if (typeof window === "undefined") {
		// Server environment
		return renderStringElement(element);
	}

	// Client environment
	const domContainer =
		typeof container === "string"
			? document.querySelector(container)
			: container;

	if (!domContainer) {
		throw new Error("Container element not found");
	}

	const domElement = renderDomElement(element, domContainer);

	return {
		element: domElement,
		props: element,
		pending: false,
	};
}
