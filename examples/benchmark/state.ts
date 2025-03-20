import { buildData, data } from "./data";
import { createState } from "../../src/state";
import { State } from "../../src";

let state: State<{
  data: {
    id: number;
    label: string;
  }[];
  selected: number | undefined;
}>;


export function benchState() {
  return state = state ?? createState({
    data,
    selected: undefined
  });
}

// Actions just modify state, they don't trigger renders
export function create(count: number): void {
  state.data = buildData(count);
}

export function append(count: number): void {
  state.data = [...state.data, ...buildData(count)];
}

export function update(): void {
  const newData = [...state.data];
  for (let i = 0; i < newData.length; i += 10) {
    if (i < newData.length) {
      newData[i] = { ...newData[i], label: newData[i].label + " !!!" };
    }
  }
  state.data = newData;
}

export function remove(id: number): void {
  const idx = state.data.findIndex((d) => d.id === id);
  state.data = [...state.data.slice(0, idx), ...state.data.slice(idx + 1)];
}

export function select(id: number): void {
  state.selected = id;
}

export function runLots(): void {
  state.data = buildData(10000);
}

export function clear(): void {
  state.data = [];
}

export function swapRows(): void {
  if (state.data.length > 998) {
    const newData = [...state.data];
    const temp = newData[1];
    newData[1] = newData[998];
    newData[998] = temp;
    state.data = newData;
  }
}