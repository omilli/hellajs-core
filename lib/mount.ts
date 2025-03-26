import { getDefaultContext } from "./context";
import { diff } from "./diff";
import type { HNode, StateRender } from "./types";

export function mount<T>(
	hNode: () => HNode,
	rootSelector = "#root",
	state: T = {} as T,
	context = getDefaultContext(),
) {
	(state as StateRender)._render = () =>
		requestAnimationFrame(() => diff(hNode(), rootSelector, context));
}
