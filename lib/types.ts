export type HTMLTagName = keyof HTMLElementTagNameMap;

// Define our custom event handler type
export type EventFn = (e: Event, el?: HTMLElement) => void;

// Create a type that supports both DOM event handlers and our custom EventFn
export type CustomEventHandlers = {
	[K in keyof GlobalEventHandlersEventMap as `on${string & K}`]?: (
		event: GlobalEventHandlersEventMap[K],
		element?: HTMLElement,
	) => void;
};

// Update HTMLElementProps to include our custom event handlers
export type HTMLElementProps<T extends HTMLTagName> = {
	[K in keyof HTMLElementTagNameMap[T] as K extends `on${string}`
		? never
		: K]?: HTMLElementTagNameMap[T][K];
} & CustomEventHandlers;

export type HellaElementProps = HTMLElementProps<HellaElementBase["type"]> & {
	className?: string;
};

export interface HellaElementBase {
	type: HTMLTagName;
	props?: HellaElementProps;
	children?: (HellaElement | string)[];
}

export type HellaElement = Partial<HellaElementBase>;

export interface RenderedElement {
	element: DocumentFragment | HTMLElement | Text;
	props: HellaElement;
	pending: boolean;
}

export interface DiffContext {
	componentCache: Map<string, RenderedElement>;
	clearCache(): void;
}

export type StateBase = {
	setRender?(render: () => RenderedElement): void;
};

export type State<T extends Record<string, any>> = T & {
	set(updates: Partial<T>): void;
};
