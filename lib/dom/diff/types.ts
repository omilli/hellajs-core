import type { Context } from "../../context";
import type { HNode } from "../types";

export type DiffConfig = {
	hNode: HNode;
	rootSelector: string;
	rootElement: Element;
	context: Context;
};
