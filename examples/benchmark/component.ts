import { html } from "../../src";
import { data, selected } from "./data";

// Rendering
const { div, table, tbody, tr, td, span, button, a, h1 } = html;

const actionButton = (label: string, id: string) => div({ className: "col-sm-6 smallpad" },
  button({
      id,
      className: "btn btn-primary btn-block",
      type: "button",
    },
    label
  )
)

export const TestComponent = () => div({ id: "main" },
    div({ className: "container" },
      div({ className: "jumbotron"},
        div({ className: "row" },
          div({ className: "col-md-6" }, h1({onclick: () => console.log(1)}, "Hella Framework")),
          div({ className: "col-md-6" },
            div({ className: "row" },
              actionButton("Create 1,000 rows", 'run'),
              actionButton("Create 10,000 rows", 'runlots'),
              actionButton("Append 1,000 rows", 'add'),
              actionButton("Update every 10th row", 'update'),
              actionButton("Clear", 'clear'),
              actionButton("Swap Rows", 'swaprows'),
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
                key: item.id,
              },
              td({ className: "col-md-1" }, item.id.toString()),
              td({ className: "col-md-4" },
                a({ className: "lbl" }, item.label)
              ),
              td({ className: "col-md-1" },
                a({ className: "remove" },
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
  );