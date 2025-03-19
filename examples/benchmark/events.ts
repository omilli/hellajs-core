import { events } from "../../src/events";
import { append, clear, create, remove, select, swapRows, update } from "./actions";
import { TestComponent } from "./component";

export function setEvents() {
  // Row selection and deletion
  const rowAction = (fn: (id: number) => void) => (e: Event) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const row = target.closest("tr");
    if (row && row.dataset.id) {
      fn(parseInt(row.dataset.id));
    }
  };

  const actions = [
    {
      $: "#run",
      fn: () => create(1000)
    },
    {
      $: "#runlots",
      fn: () => create(10000)
    },
    {
      $: "#add",
      fn: () => append(100)
    },
    {
      $: "#update",
      fn: () => update()
    },
    {
      $: "#clear",
      fn: () => clear()
    },
    {
      $: "#swaprows",
      fn: () => swapRows()
    },
    {
      $: ".remove",
      fn: rowAction(remove)
    },
    {
      $: ".lbl",
      fn: rowAction(select)
    },
  ];

  actions.forEach(({$, fn}) => {
    const appEvents = events("#root");

    appEvents.on("click", $, (e) => {
      e.preventDefault();
      fn(e);
      TestComponent();
    });
  });
}