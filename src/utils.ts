// Extract page ID from Notion URL or return as-is if already an ID
export function extractPageId(input: string): string | null {
	// Remove any dashes from UUID format
	const cleanId = (id: string) => id.replace(/-/g, "");

	// If it looks like a UUID (with or without dashes)
	const uuidPattern =
		/^[a-f0-9]{32}$|^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
	if (uuidPattern.test(input)) {
		return cleanId(input);
	}

	// Try to extract from Notion URL
	// Format: https://www.notion.so/workspace/Page-Title-abc123def456...
	// or: https://www.notion.so/Page-Title-abc123def456...
	// or: https://notion.so/abc123def456...
	const urlPattern = /notion\.so\/(?:.*-)?([a-f0-9]{32})/i;
	const match = input.match(urlPattern);
	if (match?.[1]) {
		return match[1];
	}

	// Try another URL format with query params
	const urlPattern2 = /notion\.so\/.*\?.*p=([a-f0-9]{32})/i;
	const match2 = input.match(urlPattern2);
	if (match2?.[1]) {
		return match2[1];
	}

	return null;
}
