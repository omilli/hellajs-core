import type { EventFn, HellaElement } from "../types";

export type RootContext = {
	elements: Map<
		string,
		{
			domElement: HTMLElement | Text | DocumentFragment;
			hellaElement: HellaElement;
		}
	>;
	events: {
		delegates: Set<string>;
		listeners: Map<string, Map<string, EventFn>>;
	};
};

export type RootStore = Map<string, RootContext>;

export type ContextState = {
	id: string;
	rootStore: RootStore;
	elementPool: Map<string, HTMLElement[]>;
};

export type GlobalContext = (Window & typeof globalThis) & {
	[key: string]: ContextState;
};
