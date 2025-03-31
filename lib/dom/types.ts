/**
 * Represents valid HTML tag names.
 */
export type HTMLTagName = keyof HTMLElementTagNameMap;

/**
 * Event handler function that receives an event and optional target element.
 */
export type EventFn = (e: Event, element?: HTMLElement) => void;

/**
 * Maps DOM event types to their corresponding handler functions.
 * Allows us to use event name props with an "on" prefix.
 */
type VNodeEventHandlers = {
	[K in keyof GlobalEventHandlersEventMap as `on${string & K}`]?: (
		event: GlobalEventHandlersEventMap[K],
		element?: HTMLElement,
	) => void;
};

/**
 * Defines the properties available for a specific HTML element type.
 * Excludes event handlers (which are handled separately).
 */
type VNodeAttributes<T extends HTMLTagName> = {
	[K in keyof HTMLElementTagNameMap[T] as K extends `on${string}`
		? never
		: K]?: HTMLElementTagNameMap[T][K];
} & VNodeEventHandlers;

/**
 * Represents properties that can be applied to a virtual DOM node.
 * Combines element-specific attributes with common properties.
 */
export type VNodeProps = VNodeAttributes<VNodeBase["type"]> & {
	className?: string;
	key?: string | number;
	preventDefault?: boolean;
	stopPropagation?: boolean;
};

/**
 * Represents the value of a virtual DOM node to be added to the dom.
 */
export type VNodeValue = VNode | string | number;

/**
 * Defines the core structure of a virtual DOM node with required properties.
 * Represents an HTML element with its type, properties, and children.
 */
export interface VNodeBase {
	type: HTMLTagName;
	props?: VNodeProps;
	children?: (VNode | string)[];
}

/**
 * A flexible virtual DOM node where all properties are optional.
 * This allows for fragments (nodes without a type) and other special cases.
 */
export type VNode = Partial<VNodeBase>;

/**
 * Represents a component with an optional render method.
 * Used for stateful components that need to trigger re-renders.
 */
export type StateRender = { _render?: () => void };
