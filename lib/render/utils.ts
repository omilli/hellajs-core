import type { HellaElementProps } from "../types";
import type { RenderPropHandler } from "./types";

/**
 * Retrieves a DOM element using the provided CSS selector.
 *
 * @param rootSelector - CSS selector string to identify the target DOM element
 * @returns The DOM element that matches the specified selector
 * @throws Error When the selector is not a string or when no matching element is found
 */
export function getRootElement(rootSelector?: string): Element {
	if (typeof rootSelector !== "string") {
		throw new Error("Root selector must be a string");
	}

	const domContainer = document.querySelector(rootSelector);

	if (!domContainer) {
		throw new Error("Root element not found");
	}

	return domContainer;
}

/**
 * Escapes special HTML characters in a string to prevent XSS attacks and ensure proper HTML rendering.
 * Replaces the following characters with their HTML entity equivalents e.g `&` becomes `&amp;`
 *
 * @param str - The string to escape
 * @returns The escaped HTML string
 */
export function escapeHTML(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Processes a properties object by categorizing and handling different property types.
 *
 * @param props - An object containing properties to be processed
 * @param options - Handler callbacks for different property types
 */
export function propHandler(
	props: HellaElementProps,
	{ classProp, boolProp, regularProp }: RenderPropHandler,
) {
	Object.entries(props).forEach(([key, value]) => {
		switch (true) {
			case key === "key":
				break;
			case key === "className":
				classProp(value as string);
				break;
			case value === true:
				boolProp(key);
				break;
			case value !== null && value !== undefined && value !== false:
				regularProp(key, value);
				break;
		}
	});
}
