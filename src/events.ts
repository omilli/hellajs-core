/**
 * Creates an event delegation system for the specified root element
 * @param rootSelector CSS selector for the root element
 * @returns Object with methods to manage delegated events
 */
export function events(rootSelector: string) {
  const rootElement = document.querySelector(rootSelector);
  
  if (!rootElement) {
    throw new Error(`Root element with selector "${rootSelector}" not found`);
  }
  
  // Store event handlers for cleanup
  const handlers: Array<{
    eventType: string;
    selector: string;
    handler: (e: Event) => void;
    delegatedHandler: (e: Event) => void;
  }> = [];
  
  /**
   * Attach an event handler to elements matching the selector
   */
  function on(eventType: string, selector: string, handler: (e: Event) => void) {
    const delegatedHandler = (e: Event) => {
      // Check if the event target or any of its ancestors match the selector
      let currentElement = e.target as Element | null;
      
      while (currentElement && currentElement !== rootElement) {
        if (currentElement.matches(selector)) {
          handler(e);
          return;
        }
        currentElement = currentElement.parentElement;
      }
    };
    
    // Store handler information
    handlers.push({
      eventType,
      selector,
      handler,
      delegatedHandler,
    });
    
    // Attach delegated handler to root element
    rootElement!.addEventListener(eventType, delegatedHandler);
    
    return () => {
      const index = handlers.findIndex(h => 
        h.eventType === eventType && 
        h.selector === selector && 
        h.handler === handler
      );
      
      if (index !== -1) {
        const handlerInfo = handlers[index];
        rootElement!.removeEventListener(handlerInfo.eventType, handlerInfo.delegatedHandler);
        handlers.splice(index, 1);
      }
    };
  }
  
  /**
   * Remove all event handlers
   */
  function off() {
    handlers.forEach(h => {
      rootElement!.removeEventListener(h.eventType, h.delegatedHandler);
    });
    handlers.length = 0;
  }
  
  return {
    on,
    off
  };
}

// Singleton for handling delegated events from inline attributes
let _delegatedEvents: ReturnType<typeof events> | null = null;

function getDelegatedEvents(): ReturnType<typeof events> {
  if (!_delegatedEvents) {
    _delegatedEvents = events('body');
    
    // Setup common events that might be used with delegation
    const commonEvents = ['click', 'change', 'input', 'submit', 'mousedown', 'mouseup', 'mouseover', 'mouseout'];
    commonEvents.forEach(eventType => {
      _delegatedEvents!.on(eventType, '[data-event-id]', handleDelegatedEvent);
    });
  }
  return _delegatedEvents;
}

// Global handler registry - stores all inline event handlers
const eventHandlers = new Map<string, Record<string, (e: Event) => void>>();
let nextEventId = 1;

// Handle delegated events by looking up the handler in our registry
function handleDelegatedEvent(e: Event) {
  const target = e.target as HTMLElement;
  if (!target) return;
  
  // Find the element with a data-event-id, traversing up if needed
  let current: HTMLElement | null = target;
  while (current && !current.dataset.eventId) {
    current = current.parentElement;
  }
  
  if (!current || !current.dataset.eventId) return;
  
  const eventId = current.dataset.eventId;
  const eventType = e.type;
  
  // Look up the handler
  const elementHandlers = eventHandlers.get(eventId);
  if (elementHandlers && elementHandlers[eventType]) {
    elementHandlers[eventType](e);
    return;
  }
}

// Function to register inline events from props
export function delegateEvents(element: HTMLElement, props: Record<string, any>): void {
  // Find all event handlers in props
  const eventProps = Object.entries(props).filter(([key]) => key.startsWith('on'));
  if (eventProps.length === 0) return;
  
  // Ensure we have an event ID
  if (!element.dataset.eventId) {
    element.dataset.eventId = `e${nextEventId++}`;
  }
  
  const eventId = element.dataset.eventId;
  const handlers: Record<string, (e: Event) => void> = eventHandlers.get(eventId) || {};
  
  // Register each event handler
  eventProps.forEach(([key, handler]) => {
    if (typeof handler !== 'function') return;
    
    const eventType = key.slice(2).toLowerCase(); // convert 'onClick' to 'click'
    handlers[eventType] = handler;
    
    // Make sure we have a delegated handler for this event type
    getDelegatedEvents();
  });
  
  // Save handlers to the registry
  eventHandlers.set(eventId, handlers);
}

// Export convenience function to clean up handlers for removed elements
export function cleanupEvents(element: HTMLElement): void {
  if (element.dataset.eventId) {
    eventHandlers.delete(element.dataset.eventId);
    delete element.dataset.eventId;
  }
  
  // Clean up children recursively
  Array.from(element.children).forEach(child => {
    cleanupEvents(child as HTMLElement);
  });
}

// Export for testing/debugging
export function getEventHandlerCount(): number {
  return eventHandlers.size;
}