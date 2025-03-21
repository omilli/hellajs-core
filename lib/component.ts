import { getDefaultContext } from "./context";
import { diff } from "./diff";
import type { HNode, StateRender } from "./types";

export function component<T>(
	state: T,
	hNode: () => HNode,
	rootSelector = "#root",
	context = getDefaultContext(),
): T {
	const render = requestAnimationFrame(() =>
		diff(hNode(), rootSelector, context)
	);
	
	(state as StateRender)._render = () => render
		
	return state as T;
}
