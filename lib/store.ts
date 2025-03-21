import type { EventFn, HellaElement, HellaElementProps } from "./types";

// Change to use a compound key structure
export const elementStore = new Map<
	string,
	Map<
		string,
		{
			domElement: HTMLElement | Text | DocumentFragment;
			hellaElement: HellaElement;
		}
	>
>();

// Helper functions to work with the modified store
export function storeElement({
	rootSelector,
	elementKey,
	domElement,
	hellaElement,
}: {
	rootSelector: string;
	elementKey: string;
	domElement: HTMLElement | Text | DocumentFragment;
	hellaElement: HellaElement;
}): void {
	if (!elementStore.has(rootSelector)) {
		elementStore.set(rootSelector, new Map());
	}

	elementStore.get(rootSelector)!.set(elementKey, {
		domElement,
		hellaElement,
	});
}

export function getElement(rootSelector: string, elementKey: string) {
	return elementStore.get(rootSelector)?.get(elementKey);
}

// Generate a unique key if one isn't provided
export function generateKey(): string {
	return Math.random().toString(36).substring(2, 9);
}

// Update the eventStore structure to use the same key system
export const eventStore = new Map<
	string, // rootSelector
	{
		delegates: Set<string>;
		events: Map<
			string, // elementKey
			Map<string, EventFn> // eventName -> handler
		>;
	}
>();

// Helper function to store events
export function storeEvent(
	rootSelector: string,
	elementKey: string,
	eventName: string,
	handler: EventFn,
): void {
	initRootEventStore(rootSelector);

	const rootEvents = eventStore.get(rootSelector)!;
	const { delegates, events } = rootEvents;

	if (!delegates.has(eventName)) {
		delegates.add(eventName);
		addDelegatedListener(events, eventName, rootSelector);
	}

	if (!events.has(elementKey)) {
		events.set(elementKey, new Map());
	}

	events.get(elementKey)?.set(eventName, handler);
}

export function getEventHandler(
	rootSelector: string,
	elementKey: string,
	eventName: string,
): EventFn | undefined {
	return eventStore.get(rootSelector)?.events.get(elementKey)?.get(eventName);
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

    if(!key) {
      element = element.closest("[data-e-key]") || element;
      key = element.dataset.eKey;
    };

		if (key && events.has(key)) {
			events.get(key)?.get(eventName)?.(e, element);
		}
	});
}

function initRootEventStore(rootSelector: string){
  if (!eventStore.has(rootSelector)) {
		eventStore.set(rootSelector, {
			delegates: new Set(),
			events: new Map(),
		});
	}

}
