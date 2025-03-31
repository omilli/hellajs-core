import { getRootContext } from "../context";
import type { EventFn, HNode } from "./types";
import { getRootElement } from "./utils";

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
 * Removes all event listeners associated with a root element.
 * This is useful for cleanup when unmounting components.
 *
 * @param rootSelector - CSS selector identifying the root DOM element
 */
export function cleanupAllDelegatedEvents(rootSelector: string): void {
	const rootContext = getRootContext(rootSelector);
	const { events } = rootContext;
	const { delegates, listeners } = events;
	const rootElement = document.querySelector(rootSelector);

	if (!rootElement) return;

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
 * Removes delegated event handlers for a specific element.
 *
 * @param rootSelector - CSS selector identifying the root DOM element
 * @param elementKey - Unique identifier for the element
 * @param eventName - Optional. If provided, only that specific event handler will be removed
 */
export function removeDelegatedEvents(
	rootSelector: string,
	elementKey: string,
	eventName?: string,
): void {
	const rootContext = getRootContext(rootSelector);
	const handlers = rootContext.events.handlers;

	if (!handlers.has(elementKey)) return;

	if (eventName) {
		// Remove specific event handler
		handlers.get(elementKey)?.delete(eventName);

		// If this element has no more handlers, remove the entire entry
		if (handlers.get(elementKey)?.size === 0) {
			handlers.delete(elementKey);
		}
	} else {
		// Remove all event handlers for this element
		handlers.delete(elementKey);
	}

	// Optionally: Remove event listener from root if no more elements use this event type
	cleanupUnusedDelegates(rootSelector);
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
	const { delegates, handlers, listeners } = events;

	// If this event type hasn't been delegated yet, set it up
	if (!delegates.has(eventName)) {
		delegates.add(eventName);
		const delegatedHandler = addDelegatedListener(
			hNode,
			handlers,
			eventName,
			rootSelector,
		);

		// Store the handler function for later cleanup
		listeners.set(eventName, delegatedHandler);
	}

	// Create event map for this element if it doesn't exist
	if (!handlers.has(elementKey)) {
		handlers.set(elementKey, new Map());
	}

	// Register the handler for this element and event type
	handlers.get(elementKey)?.set(eventName, handler);
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
): EventListener {
	// Create a delegated event handler
	const delegatedHandler = (e: Event) => {
			const { props = {} } = hNode;

			// Handle global event modifiers if specified
			if (props.preventDefault) e.preventDefault();
			if (props.stopPropagation) e.stopPropagation();

			// Use event.composedPath() which is more efficient than DOM traversal
			// as the browser already has this path computed
			const path = e.composedPath();
			let element: HTMLElement | null = null;
			let key: string | undefined;

			// Iterate through the path to find the first element with a data-e-key
			for (let i = 0; i < path.length; i++) {
					const el = path[i] as HTMLElement;
					if (el.dataset && el.dataset["eKey"]) {
							element = el;
							key = el.dataset["eKey"];
							break;
					}
			}

			// If we found an element with a key and it has an event handler, invoke it
			if (key && element && events.has(key)) {
					events.get(key)?.get(eventName)?.(e, element);
			}
	};

	// Attach the event listener to the root element
	const rootElement = getRootElement(rootSelector);
	rootElement.addEventListener(eventName, delegatedHandler);

	// Return the handler so it can be stored for later removal
	return delegatedHandler;
}

/**
 * Removes event handlers for event types that no longer have any handlers.
 *
 * @param rootSelector - CSS selector identifying the root DOM element
 */
function cleanupUnusedDelegates(rootSelector: string): void {
	const rootContext = getRootContext(rootSelector);
	const { events } = rootContext;
	const { delegates, handlers, listeners } = events;
	const rootElement = getRootElement(rootSelector);

	// Check each delegated event type
	for (const eventName of delegates) {
		// Check if any element still has a handler for this event
		let hasListeners = false;

		for (const listenerMap of handlers.values()) {
			if (listenerMap.has(eventName)) {
				hasListeners = true;
				break;
			}
		}

		// If no handlers remain, remove the event listener and delegate
		if (!hasListeners) {
			const listener = listeners.get(eventName);

			if (listener) {
				// Remove the actual event listener
				rootElement.removeEventListener(eventName, listener);

				// Clean up references
				listeners.delete(eventName);
				delegates.delete(eventName);
			}
		}
	}
}
