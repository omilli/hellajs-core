import { getRootContext } from "../context";
import type { EventFn, HNode } from "./types";

/**
 * Extracts event handlers from props and stores them in the eventStore
 * for event delegation. This allows the framework to efficiently handle events
 * by attaching a single listener to the root element instead of individual elements.
 *
 * @param hNode - The virtual node containing event handlers in its props
 * @param rootSelector - CSS selector identifying the root DOM element
 * @param elementKey - Unique identifier for the element (used for event delegation)
 */
export function delegateEvents(
	hNode: HNode,
	rootSelector: string,
	elementKey: string,
) {
	// Skip if there are no props to process
	if (!hNode.props) {
		return;
	}

	// For each property that starts with "on" (e.g., onclick, onchange)
	Object.entries(hNode.props).forEach(([key, value]) => {
		if (key.startsWith("on") && typeof value === "function") {
			// Extract event name (e.g., "click" from "onclick")
			const eventName = key.slice(2).toLowerCase();
			// Store the event handler using the key system
			addEvent(hNode, rootSelector, elementKey, eventName, value as EventFn);
		}
	});
}

/**
 * Registers an event handler in the event delegation system.
 * Creates necessary data structures and ensures the event listener
 * is attached to the root element.
 *
 * @param hNode - The virtual node to which the event is attached
 * @param rootSelector - CSS selector for the root element
 * @param elementKey - Unique identifier for tracking the element
 * @param eventName - The DOM event name (e.g., "click", "change")
 * @param handler - The event handler function to register
 */
function addEvent(
	hNode: HNode,
	rootSelector: string,
	elementKey: string,
	eventName: string,
	handler: EventFn,
): void {
	// Get the root context for the specified selector
	const rootContext = getRootContext(rootSelector);

	// Extract the events tracking system from the root context
	const { events } = rootContext;
	const { delegates, listeners } = events;

	// If this event type hasn't been delegated yet, set it up
	if (!delegates.has(eventName)) {
		delegates.add(eventName);
		addDelegatedListener(hNode, listeners, eventName, rootSelector);
	}

	// Create event map for this element if it doesn't exist
	if (!listeners.has(elementKey)) {
		listeners.set(elementKey, new Map());
	}

	// Register the handler for this element and event type
	listeners.get(elementKey)?.set(eventName, handler);
}

/**
 * Attaches a single event listener to the root element that handles
 * all events of a specific type through event delegation.
 *
 * This implements the event delegation pattern where a parent element
 * captures events from its children and directs them to the appropriate
 * handler based on the element's data-e-key attribute.
 *
 * @param hNode - The virtual node with event-related props
 * @param events - Map of element keys to their event handlers
 * @param eventName - The DOM event name to listen for
 * @param rootSelector - CSS selector for the root element
 */
function addDelegatedListener(
	hNode: HNode,
	events: Map<string, Map<string, EventFn>>,
	eventName: string,
	rootSelector: string,
) {
	// Attach the event listener to the root element
	document.querySelector(rootSelector)!.addEventListener(eventName, (e) => {
		const { props = {} } = hNode;

		// Handle global event modifiers if specified
		if (props.preventDefault) e.preventDefault();
		if (props.stopPropagation) e.stopPropagation();

		// Find the target element with a data-e-key attribute
		let element = e.target as HTMLElement;
		let key = element.dataset["eKey"];

		// If the target doesn't have a key, try to find a parent with a key
		if (!key) {
			element = element.closest("[data-e-key]") || element;
			key = element.dataset["eKey"];
		}

		// If we found an element with a key and it has an event handler, invoke it
		if (key && events.has(key)) {
			events.get(key)?.get(eventName)?.(e, element);
		}
	});
}
