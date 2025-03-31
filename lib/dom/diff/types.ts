import type { Context } from "../../context";
import type { VNode } from "../types";

export type DiffConfig = {
	vNode: VNode;
	rootSelector: string;
	rootElement: Element;
	context: Context;
};
