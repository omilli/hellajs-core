import { buildData, data, setData, setSelected } from "./data";

// Actions just modify state, they don't trigger renders
export function create(count: number): void {
  setData(buildData(count));
}

export function append(count: number): void {
  setData([...data, ...buildData(count)]);
}

export function update(): void {
  const newData = [...data];
  for (let i = 0; i < newData.length; i += 10) {
    if (i < newData.length) {
      newData[i] = { ...newData[i], label: newData[i].label + " !!!" };
    }
  }
  setData(newData);
}

export function remove(id: number): void {
  const idx = data.findIndex((d) => d.id === id);
  setData([...data.slice(0, idx), ...data.slice(idx + 1)]);
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
  if (data.length > 998) {
    const newData = [...data];
    const temp = newData[1];
    newData[1] = newData[998];
    newData[998] = temp;
    setData(newData);
  }
}