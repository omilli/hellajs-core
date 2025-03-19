import { EventManager, HElement } from "./types";

/**
 * Creates an event manager for any DOM element that can handle events independently
 * from the rendering process
 */
export function createEventManager(element: HTMLElement): EventManager {
  // Store event handlers by event type
  const eventHandlers: Map<
    string,
    Array<{ selector: string; callback: (e: Event) => void }>
  > = new Map();

  // Keep track of actual DOM event listener functions for cleanup
  const domListeners: Map<string, (e: Event) => void> = new Map();

  // Helper to normalize string or array inputs to arrays
  const normalizeArray = (input: string | string[]): string[] =>
    Array.isArray(input) ? input : [input];

  // Add event listener to the element
  const on = (
    events: string | string[],
    selectors: string | string[],
    callback: (e: Event) => void
  ) => {
    // Convert string arguments to arrays
    const eventArray = normalizeArray(events);
    const selectorArray = normalizeArray(selectors);

    eventArray.forEach((event) => {
      // Create the event handler array if it doesn't exist
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);

        // Create the delegated event handler
        const eventHandler = (e: Event) => {
          const handlers = eventHandlers.get(event) || [];
          if (handlers.length === 0) return;

          // Check each registered handler for this event type
          handlers.forEach(({ selector, callback: cb }) => {
            // Find if any element in the event path matches our selector
            const pathElements = e.composedPath();
            const matchedElement = pathElements.find(
              (el) =>
                el instanceof Element && (el as Element).matches?.(selector)
            );

            if (matchedElement) {
              cb(e);
            }
          });
        };

        // Store reference to the actual DOM listener for later cleanup
        domListeners.set(event, eventHandler);

        // Add the event listener to the DOM
        element.addEventListener(event, eventHandler);
      }

      // Register the callback for each selector
      const handlers = eventHandlers.get(event)!;
      selectorArray.forEach((selector) => {
        handlers.push({ selector, callback });
      });
    });

    // Return the event manager for chaining
    return { on, off, cleanup, getElement };
  };

  // Remove specific event listeners
  const off = (events?: string | string[], selectors?: string | string[]) => {
    // If no parameters, remove all event handlers
    if (!events && !selectors) {
      cleanup();
      return { on, off, cleanup, getElement };
    }

    // Convert string arguments to arrays if provided
    const eventArray = events ? normalizeArray(events) : undefined;
    const selectorArray = selectors ? normalizeArray(selectors) : undefined;

    // If only events are specified, remove all handlers for those events
    if (eventArray && !selectorArray) {
      eventArray.forEach((event) => {
        removeEventHandler(event);
      });
      return { on, off, cleanup, getElement };
    }

    // If both events and selectors are specified, remove specific handlers
    if (eventArray && selectorArray) {
      eventArray.forEach((event) => {
        const handlers = eventHandlers.get(event);
        if (handlers) {
          const newHandlers = handlers.filter(
            (handler) => !selectorArray.includes(handler.selector)
          );

          if (newHandlers.length === 0) {
            // If no handlers left for this event, remove the event listener completely
            removeEventHandler(event);
          } else {
            eventHandlers.set(event, newHandlers);
          }
        }
      });
    }

    return { on, off, cleanup, getElement };
  };

  // Helper to remove an event handler completely
  const removeEventHandler = (event: string) => {
    const listener = domListeners.get(event);
    if (listener) {
      element.removeEventListener(event, listener);
      domListeners.delete(event);
      eventHandlers.delete(event);
    }
  };

  // Completely clean up all event handlers
  const cleanup = () => {
    // Remove all actual DOM event listeners
    domListeners.forEach((listener, event) => {
      element.removeEventListener(event, listener);
    });

    // Clear all internal maps
    domListeners.clear();
    eventHandlers.clear();

    return { on, off, cleanup, getElement };
  };

  // Return the element for chaining
  const getElement = () => element;

  return {
    on,
    off,
    cleanup,
    getElement,
  };
}

// Add this function to extract inline events from the HElement tree

function extractInlineEvents(element: HElement): Array<{
  selector: string;
  event: string;
  handler: (e: Event) => void;
}> {
  const events: Array<{
    selector: string;
    event: string;
    handler: (e: Event) => void;
  }> = [];
  
  // Generate a unique selector for this element
  // We'll use data-event-id attributes to identify elements
  const extractEventsFromElement = (el: HElement, path: string = '') => {
    // Use the element's key if available, or stable properties if possible, or generate a random ID
    const currentId = el.props['data-event-id'] || 
                     (el.props._key ? `k${el.props._key}` : 
                     (el.props.id ? `id${el.props.id}` : 
                     `e${Math.random().toString(36).substr(2, 9)}`));
    
    const currentSelector = path ? `${path} [data-event-id="${currentId}"]` : `[data-event-id="${currentId}"]`;
    
    // Set the ID on the element if it doesn't have one
    if (!el.props['data-event-id']) {
      el.props['data-event-id'] = currentId;
    }
    
    // Extract inline event handlers (properties starting with 'on')
    Object.entries(el.props).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase(); // Convert 'onClick' to 'click'
        events.push({
          selector: currentSelector,
          event: eventName,
          handler: value as (e: Event) => void
        });
      }
    });
    
    // Recursively process children
    if (el.children) {
      el.children.forEach(child => {
        if (typeof child !== 'string' && child.props) {
          extractEventsFromElement(child, currentSelector);
        }
      });
    }
  };
  
  extractEventsFromElement(element);
  return events;
}

// Utility function to quickly attach events to any rendered component
export function attachEvents(component: {
  element: HTMLElement;
  props?: HElement;
}): EventManager {
  const manager = createEventManager(component.element);
  
  // If we have props, process inline events
  if (component.props) {
    const inlineEvents = extractInlineEvents(component.props);
    
    // Register all extracted events with the event manager
    inlineEvents.forEach(({ selector, event, handler }) => {
      manager.on(event, selector, handler);
    });
  }
  
  return manager;
}