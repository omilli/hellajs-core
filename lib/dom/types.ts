/**
 * Represents HTML tag names as keys from the HTMLElementTagNameMap.
 */
export type HTMLTagName = keyof HTMLElementTagNameMap;

/**
 * Represents an event handler function that receives an event and optional element.
 */
export type EventFn = (e: Event, el?: HTMLElement) => void;

/**
 * Maps DOM event types to their corresponding handler functions.
 * Uses template literals to convert event names to their 'on*' format.
 */
type HNodeEventHandlers = {
    [K in keyof GlobalEventHandlersEventMap as `on${string & K}`]?: (
        event: GlobalEventHandlersEventMap[K],
        element?: HTMLElement,
    ) => void;
};

/**
 * Defines the properties available for a specific HTML element type.
 * Excludes event handlers (which are handled separately) and combines with HNodeEventHandlers.
 */
type HNodeAttributes<T extends HTMLTagName> = {
    [K in keyof HTMLElementTagNameMap[T] as K extends `on${string}`
        ? never
        : K]?: HTMLElementTagNameMap[T][K];
} & HNodeEventHandlers;

/**
 * Represents properties that can be applied to a virtual DOM node.
 * Combines element-specific attributes with common properties.
 */
export type HNodeProps = HNodeAttributes<HNodeBase["type"]> & {
    className?: string;
    key?: string | number;
    preventDefault?: boolean;
    stopPropagation?: boolean;
};

/**
 * Defines the core structure of a virtual DOM node with required properties.
 * Represents an HTML element with its type, properties, and children.
 */
export interface HNodeBase {
    type: HTMLTagName;
    props?: HNodeProps;
    children?: (HNode | string)[];
}

/**
 * A flexible virtual DOM node where all properties are optional.
 * This allows for fragments (nodes without a type) and other special cases.
 */
export type HNode = Partial<HNodeBase>;

/**
 * Represents a component with an optional render method.
 * Used for stateful components that need to trigger re-renders.
 */
export type StateRender = { _render?: () => void };