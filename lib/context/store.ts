import type { ContextStore } from "../types";
import { getGlobalThis } from "./utils";

// Stores all contexts created by the `context` function.
export const CONTEXT_STORE: ContextStore = new Map();
// Get the global context
const globalContext = getGlobalThis();
// Key to attach the context store to the global object
const key = "hellaContextStore";
// Check if the context store already exists in the global object
// If it doesn't, create a new context store and store it
if (!globalContext[key]) {
	globalContext[key] = CONTEXT_STORE;
}
