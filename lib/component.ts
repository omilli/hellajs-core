import { render } from "./render";
import { HNode } from "./types";

export function component<T>(state: T, hNode: () => HNode, rootSelector: string = '#root'): T {
  (state as T & { _render?: () => void })._render = () => render(hNode(), rootSelector)
  render(hNode(), rootSelector)
  return state as T;
}