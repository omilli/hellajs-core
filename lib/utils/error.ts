/**
 * Handles errors by either invoking a provided callback or throwing a formatted error message.
 * 
 * @param error - The error to be handled. Can be of any type.
 * @param onError - Optional callback function that will be invoked if the error is an instance of Error.
 *                  If provided and the error is an Error instance, this callback will be called instead of throwing.
 * 
 * @throws Throws a string with error information if no callback is provided or if the error is not an Error instance.
 */
export function handleError(error: unknown, onError?: (error: Error) => void) {
	if (onError && error instanceof Error) {
		onError(error);
	} else {
		throw `Error in effect: , ${error}`;
	}
}
