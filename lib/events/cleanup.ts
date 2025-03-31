import { type RootContext, getRootContext } from "../context";
import type { RenderedElement } from "../types";
import { getRootElement } from "../utils";

/**
 * Removes all event listeners associated with a root element.
 * This is useful for cleanup when unmounting components.
 *
 * @param rootSelector - CSS selector identifying the root DOM element
 */
export function cleanupRootEvents(rootSelector: string): void {
	// Get the context for the root element
	const rootContext = getRootContext(rootSelector);
	const { events } = rootContext;
	const { delegates, listeners } = events;
	// Get the root element to clean up
	const rootElement = getRootElement(rootSelector);
	// Remove all event listeners
	for (const [eventName, handler] of listeners.entries()) {
		rootElement.removeEventListener(eventName, handler);
	}
	// Clear data structures
	listeners.clear();
	delegates.clear();
	events.listeners.clear();
}

/**
 * Recursively removes event handlers from an element and its children.
 *
 * @param element - The DOM element to clean up event handlers from
 * @param rootContext - The root context containing the events registry
 * @returns void
 *
 * This function checks if the element has registered event handlers (identified
 * by a data-eKey attribute) and removes them from the rootContext's event handler
 * registry. It then recursively processes all child nodes to clean up their
 * event handlers as well.
 */
export function cleanupEventHandlers(
	element: RenderedElement,
	rootContext: RootContext,
) {
	// Abort if the element is not an HTMLElement
	if (!(element instanceof HTMLElement)) return;
	// Clean up this element's handlers if it has an event key
	if (element.dataset?.eKey) {
		rootContext.events.handlers.delete(element.dataset.eKey);
	}
	// Recursively clean up child elements
	for (let i = 0; i < element.childNodes.length; i++) {
		cleanupEventHandlers(element.childNodes[i] as HTMLElement, rootContext);
	}
}
