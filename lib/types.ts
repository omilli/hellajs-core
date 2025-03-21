export type HTMLTagName = keyof HTMLElementTagNameMap;

export type EventFn = (e: Event, el?: HTMLElement) => void;

type HNodeEventHandlers = {
	[K in keyof GlobalEventHandlersEventMap as `on${string & K}`]?: (
		event: GlobalEventHandlersEventMap[K],
		element?: HTMLElement,
	) => void;
};

type HNodeAttributes<T extends HTMLTagName> = {
	[K in keyof HTMLElementTagNameMap[T] as K extends `on${string}`
		? never
		: K]?: HTMLElementTagNameMap[T][K];
} & HNodeEventHandlers;

export type HNodeProps = HNodeAttributes<HNodeBase["type"]> & {
	className?: string;
};

export interface HNodeBase {
	type: HTMLTagName;
	props?: HNodeProps;
	children?: (HNode | string)[];
	rawHTML?: string;
}

export type HNode = Partial<HNodeBase>;
