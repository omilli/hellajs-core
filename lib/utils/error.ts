export function handleError(error: unknown, onError?: (error: Error) => void) {
	if (onError && error instanceof Error) {
		onError(error);
	} else {
		throw `Error in effect: , ${error}`;
	}
}
