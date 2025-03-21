import { storeEvent } from "./store";
import type { EventFn, HellaElement } from "./types";

/**
 * Extracts event handlers from props and stores them in the eventStore
 * for event delegation.
 *
 * @param element - The DOM element that will receive events
 * @param props - Element properties that may include event handlers
 * @param rootSelector - The selector identifying the root element
 */

export function delegateEvents(
	hellaElement: HellaElement,
	rootSelector: string,
	elementKey: string,
) {
	if (!hellaElement.props) {
		return;
	}

	// For each property that starts with "on" (e.g., onClick, onChange)
	Object.entries(hellaElement.props).forEach(([key, value]) => {
		if (key.startsWith("on") && typeof value === "function") {
			// Extract event name (e.g., "click" from "onClick")
			const eventName = key.slice(2).toLowerCase();
			// Store the event handler using the key system
			storeEvent(rootSelector, elementKey, eventName, value as EventFn);
		}
	});
}
