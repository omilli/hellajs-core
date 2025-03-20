import type { HellaElement, RenderedElement } from "../types";
import { renderDomElement } from "./dom";
import { renderStringElement } from "./string";
import { getRootElement } from "./utils";

/**
 * Renders an HellaElement to either a string (server environment) or the DOM (client environment).
 *
 * @param hellaElement - The element to be rendered
 * @param rootSelector - Optional target rootSelector. Can be a DOM Element or a CSS selector string.
 * @returns A string in server environments or a RenderedElement instance in client environments
 */
export function render(
	hellaElement: HellaElement,
	rootSelector?: string,
): string | RenderedElement {
	// Server environment
	if (typeof window === "undefined") {
		return renderStringElement(hellaElement);
	}

	// Client environment
	const rootElement = getRootElement(rootSelector);
	const domElement = renderDomElement(hellaElement, rootElement);

	return {
		element: domElement,
		props: hellaElement,
		pending: false,
	};
}
