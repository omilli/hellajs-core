import type { EventFn, HNode } from "../types";

export type RootContext = {
	events: {
		delegates: Set<string>;
		listeners: Map<string, Map<string, EventFn>>;
	};
};

export type RootStore = Map<string, RootContext>;

export type Context<T> = {
	id: string;
	rootStore: RootStore;
	state: T;
	render: (element: HNode, rootSelector: string) => void;
	diff: (element: HNode, rootSelector: string) => void;
	mount: (hNode: () => HNode, rootSelector?: string) => void;
	elementPool?: Map<string, HTMLElement[]>;
};

export type GlobalContext = (Window & typeof globalThis) & {
	[key: string]: Context<unknown>;
};
