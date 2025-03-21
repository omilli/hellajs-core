import { getDefaultContext } from "./context";
import { diff } from "./diff";
import type { HNode, StateRender } from "./types";

export function component<T>(
	state: T,
	hNode: () => HNode,
	rootSelector = "#root",
	context = getDefaultContext(),
): T {
	(state as StateRender)._render = () => diff(hNode(), rootSelector, context);
	return state as T;
}
