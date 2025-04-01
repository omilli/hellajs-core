import type { VNodeValue } from "./dom";

/**
 * Functions that handles properties for rendering.
 */
export type RenderPropHandler = {
	/**
	 * Handles className properties.
	 * @param className
	 */
	classProp(className: string): void;
	/**
	 * Handles boolean properties (e.g., checked, disabled).
	 * @param key
	 */
	boolProp(key: string): void;
	/**
	 * Handles regular properties (e.g., id, value).
	 * @param key
	 * @param value
	 */
	regularProp(key: string, value: VNodeValue): void;
};

/**
 * Type of rendered DOM element
 */
export type RenderedElement = HTMLElement | Text | DocumentFragment;
