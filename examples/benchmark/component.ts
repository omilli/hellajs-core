import { diff, html } from "../../src";
import { clear, create, remove, select, swapRows, update } from "./actions";
import { data, selected } from "./data";

// Rendering
const { div, table, tbody, tr, td, span, button, a, h1 } = html;

const actionButton = (label: string, id: string, fn: () => void) => div({ className: "col-sm-6 smallpad" },
  button({
      id,
      className: "btn btn-primary btn-block",
      type: "button",
      onclick: hydrate(fn),
  },
    label
  )
)

export const hydrate = (fn: (e: Event) => void) => (e: Event) => {
    fn(e);
    TestComponent();
  }

export const TestComponent = () => diff(div({ id: "main" },
    div({ className: "container" },
      div({ className: "jumbotron"},
        div({ className: "row" },
          div({ className: "col-md-6" }, h1("Hella Framework")),
          div({ className: "col-md-6" },
            div({ className: "row" },
              actionButton("Create 1,000 rows", 'run', () => create(1000)),
              actionButton("Create 10,000 rows", 'runlots', () => create(10000)),
              actionButton("Append 1,000 rows", 'add', () => create(100)),
              actionButton("Update every 10th row", 'update', () => update()),
              actionButton("Clear", 'clear', () => clear()),
              actionButton("Swap Rows", 'swaprows', () => swapRows()),
            )
          )
        )
      ),
      table({ className: "table table-hover table-striped test-data" },
        tbody({ id: "tbody" },
          ...data.map((item) =>
            tr({
                "data-id": item.id.toString(),
                className: selected === item.id ? "danger" : "",
              },
              td({ className: "col-md-1" }, item.id.toString()),
              td({ className: "col-md-4" },
                a({ className: "lbl", onclick: hydrate(() => select(item.id)) }, item.label)
              ),
              td({ className: "col-md-1" },
                a({ className: "remove", onclick: hydrate(() => remove(item.id))  },
                  span({
                    className: "glyphicon glyphicon-remove",
                    "aria-hidden": "true",
                  })
                )
              ),
              td({ className: "col-md-6" })
            )
          )
        )
      ),
      span({
        className: "preloadicon glyphicon glyphicon-remove",
        "aria-hidden": "true",
      })
    )
  ), "#root");