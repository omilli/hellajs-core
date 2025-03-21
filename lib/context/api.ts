import { generateKey } from "../utils";
import { ContextState, RootContext } from "./types";
import { contextStore, getCurrentContext, getGlobalThis } from "./utils";

const CONTEXT_KEY = "domContext";

export function createContext(id?: string): ContextState {
  id ??= `hella-dom-${generateKey()}`;

  contextStore.set(id, {
    id,
    root: new Map(),
  });

  return contextStore.get(id)!;
}

export function getContext(): ContextState {
  const currentContext = getCurrentContext();

  if (currentContext) {
    return currentContext;
  }

  const context = getGlobalThis();

  if (!context[CONTEXT_KEY]) {
    context[CONTEXT_KEY] = createContext();
  }

  return context[CONTEXT_KEY] as ContextState;
}

export function getRootContext(rootSelector: string): RootContext {
  const ctx = getContext();

  if (!ctx.root.has(rootSelector)) {
    ctx.root.set(rootSelector, {
      elements: new Map(),
      events: {
        delegates: new Set(),
        listeners: new Map(),
      },
    });
  }

  return ctx.root.get(rootSelector)!;
}