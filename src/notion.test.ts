import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints.js";
import { describe, expect, it } from "vitest";
import { blocksToMarkdown, extractMermaidBlocks } from "./notion.js";

// Helper to create mock block objects
function createMockBlock(
	type: string,
	content: Record<string, unknown>,
	id = "test-block-id",
): BlockObjectResponse {
	return {
		id,
		type,
		created_time: "2024-01-01T00:00:00.000Z",
		last_edited_time: "2024-01-01T00:00:00.000Z",
		created_by: { id: "user-id", object: "user" },
		last_edited_by: { id: "user-id", object: "user" },
		has_children: false,
		archived: false,
		in_trash: false,
		parent: { type: "page_id", page_id: "page-id" },
		object: "block",
		...content,
	} as BlockObjectResponse;
}

function createRichText(text: string) {
	return [
		{
			type: "text",
			text: { content: text, link: null },
			annotations: {
				bold: false,
				italic: false,
				strikethrough: false,
				underline: false,
				code: false,
				color: "default",
			},
			plain_text: text,
			href: null,
		},
	];
}

describe("blocksToMarkdown", () => {
	describe("見出しブロック", () => {
		it("heading_1をH1マークダウンに変換する", () => {
			const blocks = [
				createMockBlock("heading_1", {
					heading_1: { rich_text: createRichText("Heading 1") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("# Heading 1");
		});

		it("heading_2をH2マークダウンに変換する", () => {
			const blocks = [
				createMockBlock("heading_2", {
					heading_2: { rich_text: createRichText("Heading 2") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("## Heading 2");
		});

		it("heading_3をH3マークダウンに変換する", () => {
			const blocks = [
				createMockBlock("heading_3", {
					heading_3: { rich_text: createRichText("Heading 3") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("### Heading 3");
		});
	});

	describe("段落ブロック", () => {
		it("paragraphをプレーンテキストに変換する", () => {
			const blocks = [
				createMockBlock("paragraph", {
					paragraph: { rich_text: createRichText("Hello, world!") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("Hello, world!");
		});

		it("空のparagraphを空文字列に変換する", () => {
			const blocks = [
				createMockBlock("paragraph", {
					paragraph: { rich_text: [] },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("");
		});
	});

	describe("リストブロック", () => {
		it("bulleted_list_itemを箇条書きに変換する", () => {
			const blocks = [
				createMockBlock("bulleted_list_item", {
					bulleted_list_item: { rich_text: createRichText("Item 1") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("- Item 1");
		});

		it("numbered_list_itemを番号付きリストに変換する", () => {
			const blocks = [
				createMockBlock("numbered_list_item", {
					numbered_list_item: { rich_text: createRichText("First item") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("1. First item");
		});

		it("to_doをチェックボックスに変換する(未チェック)", () => {
			const blocks = [
				createMockBlock("to_do", {
					to_do: { rich_text: createRichText("Task"), checked: false },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("- [ ] Task");
		});

		it("to_doをチェックボックスに変換する(チェック済み)", () => {
			const blocks = [
				createMockBlock("to_do", {
					to_do: { rich_text: createRichText("Done task"), checked: true },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("- [x] Done task");
		});
	});

	describe("コードブロック", () => {
		it("codeブロックをフェンス付きコードブロックに変換する", () => {
			const blocks = [
				createMockBlock("code", {
					code: {
						language: "javascript",
						rich_text: createRichText('console.log("hello")'),
					},
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe(
				'```javascript\nconsole.log("hello")\n```',
			);
		});

		it("mermaidコードブロックを画像プレースホルダーに変換する", () => {
			const blocks = [
				createMockBlock(
					"code",
					{
						code: {
							language: "mermaid",
							rich_text: createRichText("graph TD\n  A --> B"),
						},
					},
					"mermaid-block-123",
				),
			];
			expect(blocksToMarkdown(blocks)).toBe(
				"![Mermaid Diagram](mermaid-mermaid-block-123.svg)",
			);
		});
	});

	describe("引用ブロック", () => {
		it("quoteをブロッククオートに変換する", () => {
			const blocks = [
				createMockBlock("quote", {
					quote: { rich_text: createRichText("Famous quote") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("> Famous quote");
		});

		it("calloutを絵文字付きブロッククオートに変換する", () => {
			const blocks = [
				createMockBlock("callout", {
					callout: {
						rich_text: createRichText("Important note"),
						icon: { type: "emoji", emoji: "!" },
					},
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("> ! Important note");
		});
	});

	describe("その他のブロック", () => {
		it("dividerを水平線に変換する", () => {
			const blocks = [createMockBlock("divider", { divider: {} })];
			expect(blocksToMarkdown(blocks)).toBe("---");
		});

		it("equationをLaTeX形式に変換する", () => {
			const blocks = [
				createMockBlock("equation", {
					equation: { expression: "E = mc^2" },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("$$E = mc^2$$");
		});

		it("bookmarkをリンクに変換する", () => {
			const blocks = [
				createMockBlock("bookmark", {
					bookmark: { url: "https://example.com" },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe(
				"[https://example.com](https://example.com)",
			);
		});
	});

	describe("複数ブロック", () => {
		it("複数ブロックを改行2つで区切る", () => {
			const blocks = [
				createMockBlock("heading_1", {
					heading_1: { rich_text: createRichText("Title") },
				}),
				createMockBlock("paragraph", {
					paragraph: { rich_text: createRichText("Content") },
				}),
			];
			expect(blocksToMarkdown(blocks)).toBe("# Title\n\nContent");
		});
	});
});

describe("extractMermaidBlocks", () => {
	it("mermaidブロックを抽出する", () => {
		const mermaidContent = "graph TD\n  A --> B";
		const blocks = [
			createMockBlock(
				"code",
				{
					code: {
						language: "mermaid",
						rich_text: createRichText(mermaidContent),
					},
				},
				"block-123",
			),
		];

		const result = extractMermaidBlocks(blocks);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			content: mermaidContent,
			blockId: "block-123",
		});
	});

	it("mermaid以外のコードブロックは抽出しない", () => {
		const blocks = [
			createMockBlock("code", {
				code: {
					language: "javascript",
					rich_text: createRichText('console.log("hello")'),
				},
			}),
		];

		const result = extractMermaidBlocks(blocks);
		expect(result).toHaveLength(0);
	});

	it("複数のmermaidブロックを抽出する", () => {
		const blocks = [
			createMockBlock(
				"code",
				{
					code: {
						language: "mermaid",
						rich_text: createRichText("graph TD\n  A --> B"),
					},
				},
				"block-1",
			),
			createMockBlock("paragraph", {
				paragraph: { rich_text: createRichText("Text between diagrams") },
			}),
			createMockBlock(
				"code",
				{
					code: {
						language: "mermaid",
						rich_text: createRichText("sequenceDiagram\n  A->>B: Hello"),
					},
				},
				"block-2",
			),
		];

		const result = extractMermaidBlocks(blocks);
		expect(result).toHaveLength(2);
		expect(result[0]?.blockId).toBe("block-1");
		expect(result[1]?.blockId).toBe("block-2");
	});
});
