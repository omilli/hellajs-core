// Generate a unique key if one isn't provided
export function generateKey(): string {
	return Math.random().toString(36).substring(2, 9);
}
