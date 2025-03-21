// Generate a unique key if one isn't provided
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charlength = chars.length;

export function generateKey(): string {
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * charlength));
	}
	return result;
}
