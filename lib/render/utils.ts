import type { PropHandler } from "./types";

/**
 * Escapes special HTML characters in a string to prevent XSS attacks and ensure proper HTML rendering.
 *
 * Replaces the following characters with their HTML entity equivalents:
 * - `&` becomes `&amp;`
 * - `<` becomes `&lt;`
 * - `>` becomes `&gt;`
 * - `"` becomes `&quot;`
 * - `'` becomes `&#039;`
 *
 * @param str - The string to escape
 * @returns The escaped HTML string
 */
export function escapeHTML(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function propHandler(
	props: Record<string, any>,
	{ classProp, boolProp, regularProp }: PropHandler,
) {
	Object.entries(props).forEach(([key, value]) => {
		switch (true) {
			case key === "key":
				break;
			case key === "className":
				classProp(value as string);
				break;
			case value === true:
				boolProp(key);
				break;
			case value !== null && value !== undefined && value !== false:
				regularProp(key, value);
				break;
		}
	});
}
