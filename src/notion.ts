import { Client } from "@notionhq/client";
import type {
	BlockObjectResponse,
	RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { type AppResult, err, type MermaidBlock, ok } from "./types.js";

// Initialize Notion client
export function createNotionClient(apiToken: string): Client {
	return new Client({ auth: apiToken });
}

// Extract plain text from rich text array
function richTextToPlain(richText: RichTextItemResponse[]): string {
	return richText.map((t) => t.plain_text).join("");
}

// Get page title
export async function getPageTitle(
	client: Client,
	pageId: string,
): Promise<AppResult<string>> {
	try {
		const page = await client.pages.retrieve({ page_id: pageId });

		if (!("properties" in page)) {
			return ok("Untitled");
		}

		// Try to find title property
		for (const prop of Object.values(page.properties)) {
			if (prop.type === "title" && prop.title.length > 0) {
				return ok(richTextToPlain(prop.title));
			}
		}

		return ok("Untitled");
	} catch (error) {
		return err({
			type: "NOTION_API_ERROR",
			message: error instanceof Error ? error.message : String(error),
		});
	}
}

// Fetch all blocks from a page recursively
export async function fetchAllBlocks(
	client: Client,
	blockId: string,
): Promise<AppResult<BlockObjectResponse[]>> {
	try {
		const blocks: BlockObjectResponse[] = [];
		let cursor: string | undefined;

		do {
			const response = await client.blocks.children.list({
				block_id: blockId,
				start_cursor: cursor,
				page_size: 100,
			});

			for (const block of response.results) {
				if ("type" in block) {
					blocks.push(block);

					// Recursively fetch children if block has children
					if (block.has_children) {
						const children = await fetchAllBlocks(client, block.id);
						if (children.ok) {
							blocks.push(...children.value);
						}
					}
				}
			}

			cursor = response.has_more
				? (response.next_cursor ?? undefined)
				: undefined;
		} while (cursor);

		return ok(blocks);
	} catch (error) {
		return err({
			type: "NOTION_API_ERROR",
			message: error instanceof Error ? error.message : String(error),
		});
	}
}

// Convert Notion blocks to Markdown
export function blocksToMarkdown(blocks: BlockObjectResponse[]): string {
	const lines: string[] = [];

	for (const block of blocks) {
		const md = blockToMarkdown(block);
		if (md) {
			lines.push(md);
		}
	}

	return lines.join("\n\n");
}

// Convert a single block to Markdown
function blockToMarkdown(block: BlockObjectResponse): string | null {
	switch (block.type) {
		case "paragraph":
			return richTextToPlain(block.paragraph.rich_text);

		case "heading_1":
			return `# ${richTextToPlain(block.heading_1.rich_text)}`;

		case "heading_2":
			return `## ${richTextToPlain(block.heading_2.rich_text)}`;

		case "heading_3":
			return `### ${richTextToPlain(block.heading_3.rich_text)}`;

		case "bulleted_list_item":
			return `- ${richTextToPlain(block.bulleted_list_item.rich_text)}`;

		case "numbered_list_item":
			return `1. ${richTextToPlain(block.numbered_list_item.rich_text)}`;

		case "to_do": {
			const checked = block.to_do.checked ? "x" : " ";
			return `- [${checked}] ${richTextToPlain(block.to_do.rich_text)}`;
		}

		case "toggle":
			return `<details><summary>${richTextToPlain(block.toggle.rich_text)}</summary></details>`;

		case "quote":
			return `> ${richTextToPlain(block.quote.rich_text)}`;

		case "callout": {
			const icon =
				block.callout.icon?.type === "emoji"
					? `${block.callout.icon.emoji} `
					: "";
			return `> ${icon}${richTextToPlain(block.callout.rich_text)}`;
		}

		case "code": {
			const language = block.code.language;
			const code = richTextToPlain(block.code.rich_text);

			if (language === "mermaid") {
				// Use placeholder that will be replaced with image
				return `![Mermaid Diagram](mermaid-${block.id}.svg)`;
			}

			return `\`\`\`${language}\n${code}\n\`\`\``;
		}

		case "divider":
			return "---";

		case "image":
			if (block.image.type === "external") {
				return `![Image](${block.image.external.url})`;
			} else if (block.image.type === "file") {
				return `![Image](${block.image.file.url})`;
			}
			return null;

		case "bookmark":
			return `[${block.bookmark.url}](${block.bookmark.url})`;

		case "link_preview":
			return `[${block.link_preview.url}](${block.link_preview.url})`;

		case "table_of_contents":
			return "[TOC]";

		case "equation":
			return `$$${block.equation.expression}$$`;

		case "child_page":
			return `**[${block.child_page.title}]**`;

		case "child_database":
			return `**[Database: ${block.child_database.title}]**`;

		default:
			return null;
	}
}

// Extract mermaid blocks from Notion blocks
export function extractMermaidBlocks(
	blocks: BlockObjectResponse[],
): MermaidBlock[] {
	const mermaidBlocks: MermaidBlock[] = [];

	for (const block of blocks) {
		if (block.type === "code" && block.code.language === "mermaid") {
			mermaidBlocks.push({
				content: richTextToPlain(block.code.rich_text),
				blockId: block.id,
			});
		}
	}

	return mermaidBlocks;
}
