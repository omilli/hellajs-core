import { getDefaultContext } from "./context";
import { diff, type HNode } from "./dom";
import { computed, effect } from "./reactive";

export function mount(hNodeEffect: () => HNode, rootSelector = "#root", context = getDefaultContext()) {
  const component = computed(hNodeEffect);
  effect(() => {
    diff(component(), rootSelector, context);
  })
}