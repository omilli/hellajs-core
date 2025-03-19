import { diff, attachEvents, RenderedComponent, EventManager } from "../../src/index";
import { TestComponent } from "./component";
import { setEvents } from "./events";

let events: EventManager;
let app: RenderedComponent;

const render = () => {
  events?.cleanup();
  app = diff(TestComponent(), "#root");
  events = attachEvents(app);
  setEvents(events, render);
}

render();