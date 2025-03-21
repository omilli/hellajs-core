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
	if (!eventStore.has(rootSelector)) {
		eventStore.set(rootSelector, {
			delegates: new Set(),
			events: new Map(),
		});
	}

	const rootEvents = eventStore.get(rootSelector)!;
	const { delegates, events } = rootEvents;

	if (!delegates.has(eventName)) {
		delegates.add(eventName);

		addDelegatedListener(events, elementKey, eventName, rootSelector);
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
	elementKey: string,
	eventName: string,
	rootSelector: string,
) {
	document.querySelector(rootSelector)!.addEventListener(eventName, (e) => {
		const element = e.target as HTMLElement & HellaElementProps;
		const key = element.getAttribute("key") || "";
		if (!events.has(key)) {
			events.get(elementKey)?.get(eventName)?.call(element, e);
		}
	});
}
