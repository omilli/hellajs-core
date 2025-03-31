import { getRootContext } from "../context";
import type { EventFn, VNode } from "../types";
import { getRootElement } from "../utils";

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
