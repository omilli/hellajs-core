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
	// Only process strings that need escaping
	if (!/[&<>"']/.test(str)) return str;

	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}