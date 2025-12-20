import { describe, expect, it } from "vitest";
import { updateMarkdownWithImages } from "./mermaid.js";
import type { RenderedImage } from "./types.js";

describe("updateMarkdownWithImages", () => {
	it("SVGプレースホルダーをSVGパスに置換する", () => {
		const markdown = "# Title\n\n![Mermaid Diagram](mermaid-block-123.svg)";
		const images: RenderedImage[] = [
			{
				blockId: "block-123",
				path: "/output/mermaid-block-123.svg",
				format: "svg",
			},
		];

		const result = updateMarkdownWithImages(markdown, images);
		expect(result).toBe("# Title\n\n![Mermaid Diagram](mermaid-block-123.svg)");
	});

	it("SVGプレースホルダーをPNGパスに置換する", () => {
		const markdown = "# Title\n\n![Mermaid Diagram](mermaid-block-123.svg)";
		const images: RenderedImage[] = [
			{
				blockId: "block-123",
				path: "/output/mermaid-block-123.png",
				format: "png",
			},
		];

		const result = updateMarkdownWithImages(markdown, images);
		expect(result).toBe("# Title\n\n![Mermaid Diagram](mermaid-block-123.png)");
	});

	it("複数の画像プレースホルダーを置換する", () => {
		const markdown = `# Diagrams

![Mermaid Diagram](mermaid-block-1.svg)

Some text

![Mermaid Diagram](mermaid-block-2.svg)`;

		const images: RenderedImage[] = [
			{
				blockId: "block-1",
				path: "/output/mermaid-block-1.png",
				format: "png",
			},
			{
				blockId: "block-2",
				path: "/output/mermaid-block-2.png",
				format: "png",
			},
		];

		const result = updateMarkdownWithImages(markdown, images);
		expect(result).toContain("mermaid-block-1.png");
		expect(result).toContain("mermaid-block-2.png");
		expect(result).not.toContain(".svg");
	});

	it("画像がない場合はマークダウンを変更しない", () => {
		const markdown = "# Title\n\nNo diagrams here.";
		const images: RenderedImage[] = [];

		const result = updateMarkdownWithImages(markdown, images);
		expect(result).toBe(markdown);
	});

	it("マッチしないプレースホルダーは変更しない", () => {
		const markdown = "![Mermaid Diagram](mermaid-unknown-block.svg)";
		const images: RenderedImage[] = [
			{
				blockId: "block-123",
				path: "/output/mermaid-block-123.png",
				format: "png",
			},
		];

		const result = updateMarkdownWithImages(markdown, images);
		expect(result).toBe("![Mermaid Diagram](mermaid-unknown-block.svg)");
	});

	it("pathPrefixオプションでパスにプレフィックスを追加する", () => {
		const markdown = "![Mermaid Diagram](mermaid-block-123.svg)";
		const images: RenderedImage[] = [
			{
				blockId: "block-123",
				path: "/output/mermaid-block-123.png",
				format: "png",
			},
		];

		const result = updateMarkdownWithImages(markdown, images, {
			pathPrefix: "images/",
		});
		expect(result).toBe("![Mermaid Diagram](images/mermaid-block-123.png)");
	});
});
