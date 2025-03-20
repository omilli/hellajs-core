import { State } from "./types";

export function state<T extends Record<string, any>>(initialState: T): State<T> {
  // Store the render function
  let renderFunction: (() => void) | null = null;
  
  // Batching mechanism
  let updatePending = false;
  const batchUpdates = () => {
    if (!updatePending && renderFunction) {
      updatePending = true;
      Promise.resolve().then(() => {
        updatePending = false;
        renderFunction?.();
      });
    }
  };

  // Function to set a render function
  const setRender = (render: () => void): void => {
    renderFunction = render;
  };

  // Function to update multiple properties at once
  const set = (updates: Partial<T>): void => {
    Object.entries(updates).forEach(([key, value]) => {
      (state as any)[key] = value;
    });
    // Trigger only one re-render after all updates
    batchUpdates();
  };

  const state: State<T> = {
    ...initialState,
    setRender,
    set
  };

  // Create a recursive proxy handler with a weakmap cache
  const proxyCache = new WeakMap();
  
  const createHandler = (path = ""): ProxyHandler<any> => ({
    get(target, prop) {
      // Handle special functions
      if (prop === "setStateRender") return setRender;
      if (prop === "setState") return set;
      
      // Handle special cases
      if (typeof prop === "symbol" || prop === "toString") {
        return Reflect.get(target, prop);
      }

      const value = target[prop];
      
      // Create nested proxies for objects, with caching
      if (value && typeof value === "object") {
        // Check cache first
        if (proxyCache.has(value)) {
          return proxyCache.get(value);
        }
        
        const proxy = new Proxy(value, createHandler(`${path ? path + '.' : ''}${String(prop)}`));
        proxyCache.set(value, proxy);
        return proxy;
      }
      
      return value;
    },

    set(target, prop, value) {
      if (target[prop] === value) return true; // Don't update if unchanged
      
      // Update the value
      target[prop] = value;
      
      // Batch the updates
      batchUpdates();
      
      return true;
    },
  });

  // Create the main proxy
  return new Proxy(state, createHandler()) as State<T>;
}