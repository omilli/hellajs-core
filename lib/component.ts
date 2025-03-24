import { getDefaultContext } from "./context";
import { diff } from "./diff";
import type { HNode, StateRender } from "./types";

export function component<T>(
	hNode: () => HNode,
	rootSelector = "#root",
	state: T = {} as T,
	context = getDefaultContext(),
) {
	(state as StateRender)._render = () =>
		requestAnimationFrame(() => diff(hNode(), rootSelector, context));
}
