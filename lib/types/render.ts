import type { VNodeValue } from "./nodes";

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
	/**
	 * Handles dataset properties for data-* attributes.
	 * @param datasetObj The dataset object containing key-value pairs
	 */
	datasetProp?(datasetObj: Record<string, string>): void;
};

/**
 * Type of rendered DOM element
 */
export type RenderedElement = HTMLElement | Text | DocumentFragment;
