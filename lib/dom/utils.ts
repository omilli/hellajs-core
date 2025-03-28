const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charlength = chars.length;

/**
 * Generates a random string key of 6 characters.
 *
 * The key is composed of characters randomly selected from the
 * predefined character set (`chars`).
 *
 * @returns A random 6-character string
 */
export function generateKey(): string {
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * charlength));
	}
	return result;
}

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
