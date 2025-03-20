export type HTMLTagName = keyof HTMLElementTagNameMap;

export type HTMLElementProps<T extends HTMLTagName> = {
	[K in keyof HTMLElementTagNameMap[T]]?: HTMLElementTagNameMap[T][K];
};

export type HellaElementProps = HTMLElementProps<HellaElementBase["type"]> & {
	className?: string;
	key?: string;
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

export type EventFn = (e: Event) => void;

export type StateBase = {
	setRender?(render: () => RenderedElement): void;
};

export type State<T extends Record<string, any>> = T & {
	set(updates: Partial<T>): void;
};
