// Static counter for key generation (module-level counter)
let keyCounter = 0;

/**
 * Generates a unique key using an incremental numeric counter.
 * This is more efficient than random string generation for large-scale applications
 * as it avoids string concatenation and Math.random() calls.
 *
 * @returns A unique string key representing the counter value
 */
export function generateKey(): string {
  // Reset counter if it approaches MAX_SAFE_INTEGER to prevent overflow
  if (keyCounter >= Number.MAX_SAFE_INTEGER) {
    keyCounter = 0;
  }
  return (++keyCounter).toString();
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
