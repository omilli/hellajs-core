import type { ContextState } from "../context";
import type { HNode } from "../types";

export type RenderPropHandler = {
	classProp(className: string): void;
	boolProp(key: string): void;
	regularProp(key: string, value: any): void;
};

export type RenderDomArgs = {
	hNode?: HNode | string;
	rootElement?: Element;
	element?: RenderedElement;
	rootSelector?: string;
	context?: ContextState;
};

export type RenderedElement = HTMLElement | Text | DocumentFragment;

export interface RenderedNode {
	element: DocumentFragment | HTMLElement | Text;
	hNode: HNode;
}
