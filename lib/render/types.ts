import type { ContextState } from "../context";
import type { HellaElement } from "../types";

export type RenderPropHandler = {
	classProp(className: string): void;
	boolProp(key: string): void;
	regularProp(key: string, value: any): void;
};

export type RenderDomArgs = {
	hellaElement?: HellaElement | string;
	rootElement?: Element;
	domElement?: RenderReturnElement;
	rootSelector?: string;
	context?: ContextState;
};

export type RenderReturnElement = HTMLElement | Text | DocumentFragment;
