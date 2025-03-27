import { diff, render } from "../dom";
import { generateKey } from "../dom/utils";
import { batch, computed, effect, NOT_TRACKING, signal, untracked } from "../reactive";
import type { Context, RootContext } from "./types";
import { getGlobalThis } from "./utils";

const contextStore: Map<string, Context> = new Map();

export function context(id?: string): Context {
  id ??= `hella-dom-${generateKey()}`;

  const contextState: Context = {
    id,
    signal:(...args) => signal(...args, contextState),
    effect: (...args) => effect(...args, contextState),
    computed: (fn) => computed(fn),
    batch: (fn) => batch(fn, contextState),
    untracked: (fn) =>untracked(fn, contextState),
    render: (...args) => render(...args, contextState),
    diff: (...args) => diff(...args, contextState),
    dom: {
      rootStore: new Map(),
    },
    reactive: {
      activeTracker: NOT_TRACKING,
      pendingNotifications: [],
      pendingRegistry: new Set(),
      executionContext: [],
      effectDependencies: new Map(),
      effects: new Set(),
      signals: new WeakSet(),
      batchDepth: 0,
      currentExecutingEffect: null,
      parentChildEffectsMap: new WeakMap(),
    }
  }

  contextStore.set(id, contextState);

  return contextState;
}

export function getDefaultContext(): Context {
  const globalContext = getGlobalThis();
  const key = "domContext";

  if (!globalContext[key]) {
    globalContext[key] = context();
  }

  return globalContext[key];
}

export function getRootContext(
	rootSelector: string,
	{ dom } = getDefaultContext(),
): RootContext {
	if (!dom.rootStore.has(rootSelector)) {
		dom.rootStore.set(rootSelector, {
			events: {
				delegates: new Set(),
				listeners: new Map(),
			},
		});
	}

	return dom.rootStore.get(rootSelector)!;
}