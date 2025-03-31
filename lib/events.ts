import { type RootContext, getRootContext } from "./context";
import type { EventFn, VNode, RenderedElement } from "./types";
import { getRootElement } from "./utils";

/**
 * Extracts event handlers from props and stores them in the eventStore
 * for event delegation. This allows the framework to efficiently handle events
 * by attaching a single listener to the root element instead of individual elements.
 *
 * @param vNode - The virtual node containing event handlers in its props
 * @param rootSelector - CSS selector identifying the root DOM element
 * @param elementKey - Unique identifier for the element (used for event delegation)
 */
export function delegateEvents(
	vNode: VNode,
	rootSelector: string,
	elementKey: string,
) {
	// Skip if there are no props to process
	if (!vNode.props) {
		return;
	}

	// For each property that starts with "on" (e.g., onclick, onchange)
	Object.entries(vNode.props).forEach(([key, value]) => {
		if (key.startsWith("on") && typeof value === "function") {
			// Extract event name (e.g., "click" from "onclick")
			const eventName = key.slice(2).toLowerCase();
			// Store the event handler using the key system
			addEvent(vNode, rootSelector, elementKey, eventName, value as EventFn);
		}
	});
}

/**
 * Removes all event listeners associated with a root element.
 * This is useful for cleanup when unmounting components.
 *
 * @param rootSelector - CSS selector identifying the root DOM element
 */
export function cleanupRootsEvents(rootSelector: string): void {
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
	if (!(element instanceof HTMLElement)) return;

	// Clean up this element's handlers if it has an event key
	if (element.dataset && element.dataset.eKey) {
		rootContext.events.handlers.delete(element.dataset.eKey);
	}

	// Recursively clean up child elements
	for (let i = 0; i < element.childNodes.length; i++) {
		cleanupEventHandlers(element.childNodes[i] as HTMLElement, rootContext);
	}
}

/**
 * Registers an event handler in the event delegation system.
 * Creates necessary data structures and ensures the event listener
 * is attached to the root element.
 *
 * @param vNode - The virtual node to which the event is attached
 * @param rootSelector - CSS selector for the root element
 * @param elementKey - Unique identifier for tracking the element
 * @param eventName - The DOM event name (e.g., "click", "change")
 * @param handler - The event handler function to register
 */
function addEvent(
	vNode: VNode,
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
			vNode,
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
 * @param vNode - The virtual node with event-related props
 * @param events - Map of element keys to their event handlers
 * @param eventName - The DOM event name to listen for
 * @param rootSelector - CSS selector for the root element
 */
function addDelegatedListener(
	vNode: VNode,
	events: Map<string, Map<string, EventFn>>,
	eventName: string,
	rootSelector: string,
): EventListener {
	// Create a delegated event handler
	const delegatedHandler = (e: Event) => {
		const { props = {} } = vNode;

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
