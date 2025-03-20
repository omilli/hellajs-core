import { RenderedComponent } from "./types";

export function createState<T extends Record<string, any>>(
  initialState: T, 
  component: () => RenderedComponent
): T {
  // Create a recursive proxy handler
  const createHandler = (path = ""): ProxyHandler<any> => ({
    get(target, prop) {
      // Handle special cases (typeof, toString, etc)
      if (prop === Symbol.toStringTag || prop === "toString") {
        return () => Object.prototype.toString.call(target);
      }
      
      const value = target[prop];
      // If the property is an object, return a nested proxy
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return new Proxy(value, createHandler(`${path}.${String(prop)}`));
      }
      return value;
    },
    
    set(target, prop, value) {
      // Update the value
      target[prop] = value;
      
      // Trigger re-render
      component()
      
      return true;
    }
  });
  
  // Create the main proxy
  return new Proxy(initialState, createHandler());
}