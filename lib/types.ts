export type HTMLTagName = keyof HTMLElementTagNameMap;

export type HTMLElementProps<T extends HTMLTagName> = {
	[K in keyof HTMLElementTagNameMap[T]]?: HTMLElementTagNameMap[T][K];
};

export interface HellaElement {
	type: HTMLTagName;
	props?: HTMLElementProps<HellaElement["type"]> & {
		className?: string;
		key?: string;
	};
	children?: (HellaElement | string)[];
}

// Simplified render result without event handling
export interface RenderedComponent {
	element: HTMLElement | Text;
	props: HellaElement;
	pending: boolean;
}

export interface DiffContext {
	componentCache: Map<string, RenderedComponent>;
	clearCache(): void;
}

export type EventFn = (e: Event) => void;

export type StateBase = {
	setRender?(render: () => RenderedComponent): void;
};

export type State<T extends Record<string, any>> = T & {
	set(updates: Partial<T>): void;
};
