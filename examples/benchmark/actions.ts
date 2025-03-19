import { buildData, data, selected, setData, setSelected } from "./data";
import type { RenderedComponent } from "../../src/types";

export let state: {
  data: {
    id: number;
    label: string;
  }[];
  selected: number | undefined;
};

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
      setTimeout(() => component(), 0);
      
      return true;
    }
  });
  
  // Create the main proxy
  return new Proxy(initialState, createHandler());
}

export function initState(component: () => RenderedComponent) {
  return state = createState({
    data,
    selected
  }, component);
}

// Actions just modify state, they don't trigger renders
export function create(count: number): void {
  state.data = buildData(count);
}

export function append(count: number): void {
  setData([...state.data, ...buildData(count)]);
}

export function update(): void {
  const newData = [...state.data];
  for (let i = 0; i < newData.length; i += 10) {
    if (i < newData.length) {
      newData[i] = { ...newData[i], label: newData[i].label + " !!!" };
    }
  }
  setData(newData);
}

export function remove(id: number): void {
  const idx = state.data.findIndex((d) => d.id === id);
  setData([...state.data.slice(0, idx), ...state.data.slice(idx + 1)]);
}

export function select(id: number): void {
  setSelected(id);
}

export function runLots(): void {
  setData(buildData(10000));
}

export function clear(): void {
  setData([]);
}

export function swapRows(): void {
  if (state.data.length > 998) {
    const newData = [...state.data];
    const temp = newData[1];
    newData[1] = newData[998];
    newData[998] = temp;
    setData(newData);
  }
}