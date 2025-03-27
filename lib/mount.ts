import { getDefaultContext } from "./context";
import { type HNode, diff } from "./dom";
import { computed, effect } from "./reactive";

export function mount(
	hNodeEffect: () => HNode,
	rootSelector = "#root",
	context = getDefaultContext(),
) {
	const component = computed(hNodeEffect);
	effect(() => {
		diff(component(), rootSelector, context);
	});
}
