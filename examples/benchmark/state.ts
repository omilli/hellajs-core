import { state } from "../../lib/state";
import { buildData, data } from "./data";

let benchState: {
  data: {
    id: number;
    label: string;
  }[];
  selected: number | undefined;
};


export function useBenchState() {
  return benchState = benchState ?? state({
    data,
    selected: undefined
  });
}

// Actions just modify benchState, they don't trigger renders
export function create(count: number): void {
  benchState.data = buildData(count);
}

export function append(count: number): void {
  benchState.data = [...benchState.data, ...buildData(count)];
}

export function update(): void {
  const newData = [...benchState.data];
  for (let i = 0; i < newData.length; i += 10) {
    if (i < newData.length) {
      newData[i] = { ...newData[i], label: newData[i].label + " !!!" };
    }
  }
  benchState.data = newData;
}

export function remove(id: number): void {
  const idx = benchState.data.findIndex((d) => d.id === id);
  benchState.data = [...benchState.data.slice(0, idx), ...benchState.data.slice(idx + 1)];
}

export function select(id: number): void {
  benchState.selected = id;
}

export function runLots(): void {
  benchState.data = buildData(10000);
}

export function clear(): void {
  benchState.data = [];
}

export function swapRows(): void {
  if (benchState.data.length > 998) {
    const newData = [...benchState.data];
    const temp = newData[1];
    newData[1] = newData[998];
    newData[998] = temp;
    benchState.data = newData;
  }
}