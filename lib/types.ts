export interface Props {
	[key: string]: any;
	className?: string;
	id?: string;
	style?: Record<string, string | number>;
}

export interface HElement {
	type: string;
	props?: Props;
	children?: (HElement | string)[];
}

// Simplified render result without event handling
export interface RenderedComponent {
	element: HTMLElement | Text;
	props: HElement;
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

export type Renderer<T> = {
	createTextNode: (text: string) => T;
	createElement: (type: string) => T;
	setClassName: (node: T, value: string) => T;
	setStyle: (node: T, styles: Record<string, any>) => T;
	setAttribute: (node: T, key: string, value: any) => T;
	setBooleanAttribute: (node: T, key: string, value: boolean) => T;
	appendChild: (parent: T, child: T) => T;
	processNode: (node: T, type: string) => T;
};

/**
 * Type definition for string renderer node
 */
export interface StringNode {
	tagName: string;
	attrsHTML: string;
	content: string;
	type: string;
	html?: string;
}
