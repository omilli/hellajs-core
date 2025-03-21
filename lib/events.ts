import { getRootContext } from "./context";
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
			addContextEvent(rootSelector, elementKey, eventName, value as EventFn);
		}
	});
}

// Helper function to store events
function addContextEvent(
	rootSelector: string,
	elementKey: string,
	eventName: string,
	handler: EventFn,
): void {
	const rootContext = getRootContext(rootSelector);

	const { events } = rootContext;
	const { delegates, listeners } = events;

	if (!delegates.has(eventName)) {
		delegates.add(eventName);
		addDelegatedListener(listeners, eventName, rootSelector);
	}

	if (!listeners.has(elementKey)) {
		listeners.set(elementKey, new Map());
	}

	listeners.get(elementKey)?.set(eventName, handler);
}

function addDelegatedListener(
	events: Map<string, Map<string, EventFn>>,
	eventName: string,
	rootSelector: string,
) {
	document.querySelector(rootSelector)!.addEventListener(eventName, (e) => {
		e.preventDefault();
		e.stopPropagation();

		let element = e.target as HTMLElement;
		let key = element.dataset.eKey;

		if (!key) {
			element = element.closest("[data-e-key]") || element;
			key = element.dataset.eKey;
		}

		if (key && events.has(key)) {
			events.get(key)?.get(eventName)?.(e, element);
		}
	});
}
