import { html, mount, signal } from "../lib";

const { div, button } = html;

const counter = signal(0);

const increment = () => counter.set(counter() + 1);
const decrement = () => counter.set(counter() - 1);

const view = () =>
	div(
		button({ onClick: decrement }, "-"),
		counter(),
		button({ onClick: increment }, "+"),
	);

mount(view);
