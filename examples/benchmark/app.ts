import { diff, html } from "../../src";
import { hydrater } from "../../src/hydrater";
import { append, clear, create, remove, select, swapRows, update } from "./actions";
import { data, selected } from "./data";

// Rendering
const { div, table, tbody, tr, td, span, button, a, h1 } = html;

const $ = hydrater(Benchmark);

export function Benchmark() {
  const actionButton = (label: string, id: string, fn: () => void) =>
    div(
      { className: "col-sm-6 smallpad" },
      button(
        {
          id,
          className: "btn btn-primary btn-block",
          type: "button",
          onclick: $(fn),
        },
        label
      )
    );

  const jumbo = div({ className: "jumbotron" },
    div({ className: "row" },
      div({ className: "col-md-6" }, h1("Hella Framework")),
      div({ className: "col-md-6" },
        div({ className: "row" },
          actionButton("Create 1,000 rows", "run", () => create(1000)),
          actionButton("Create 10,000 rows", "runlots", () => create(10000)),
          actionButton("Append 1,000 rows", "add", () => append(1000)),
          actionButton("Update every 10th row", "update", () => update()),
          actionButton("Clear", "clear", () => clear()),
          actionButton("Swap Rows", "swaprows", () => swapRows())
        )
      )
    )
  );

  const dataTable = table({ className: "table table-hover table-striped test-data" },
    tbody({ id: "tbody" },
      ...data.map((item) =>
        tr({
            "data-id": item.id.toString(),
            className: selected === item.id ? "danger" : "",
            key: item.id,
          },
          td({ className: "col-md-1" }, item.id.toString()),
          td({ className: "col-md-4" },
            a({
                className: "lbl",
                onclick: $(() => select(item.id)),
              },
              item.label
            )
          ),
          td({ className: "col-md-1" },
            a({
                className: "remove",
                onclick: $(() => remove(item.id)),
              },
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
  )

  return diff(
    div({ id: "main" },
      div({ className: "container" },
        jumbo,
        dataTable,
        span({
          className: "preloadicon glyphicon glyphicon-remove",
          "aria-hidden": "true",
        })
      )
    ),
    "#root"
  );
}
