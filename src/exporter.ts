import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { err, ok } from "neverthrow";
import { renderAllMermaidBlocks, updateMarkdownWithImages } from "./mermaid.js";
import {
	blocksToMarkdown,
	createNotionClient,
	extractMermaidBlocks,
	fetchAllBlocks,
	getPageTitle,
} from "./notion.js";
import { markdownToHtml, markdownToPdf, saveMarkdown } from "./pdf.js";
import type {
	AppResult,
	ExportOptions,
	ExportResult,
	NotionConfig,
} from "./types.js";

// Sanitize filename
function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, "-")
		.replace(/\s+/g, "-")
		.slice(0, 100);
}

// Main export function
export async function exportNotionPage(
	config: NotionConfig,
	options: ExportOptions,
	verbose = false,
): Promise<AppResult<ExportResult>> {
	const { apiToken, pageId } = config;
	const { outputFormat, imageFormat, theme, outputPath, customCss } = options;

	if (verbose) console.log("Connecting to Notion API...");

	const client = createNotionClient(apiToken);

	// Get page title
	if (verbose) console.log("Fetching page title...");
	const titleResult = await getPageTitle(client, pageId);
	if (titleResult.isErr()) {
		return err(titleResult.error);
	}
	const pageTitle = titleResult.value;
	if (verbose) console.log(`Page title: ${pageTitle}`);

	// Fetch all blocks
	if (verbose) console.log("Fetching page content...");
	const blocksResult = await fetchAllBlocks(client, pageId);
	if (blocksResult.isErr()) {
		return err(blocksResult.error);
	}
	const blocks = blocksResult.value;
	if (verbose) console.log(`Fetched ${blocks.length} blocks`);

	// Extract mermaid blocks
	const mermaidBlocks = extractMermaidBlocks(blocks);
	if (verbose) console.log(`Found ${mermaidBlocks.length} mermaid diagram(s)`);

	// Create output directory
	const safeTitle = sanitizeFilename(pageTitle);
	const workDir = join(outputPath, safeTitle);
	const imagesDir = join(workDir, "images");

	try {
		await mkdir(imagesDir, { recursive: true });
	} catch (error) {
		return err({
			type: "IO_ERROR",
			message: `Failed to create output directory: ${error instanceof Error ? error.message : String(error)}`,
		});
	}

	// Convert blocks to markdown
	if (verbose) console.log("Converting to Markdown...");
	let markdown = `# ${pageTitle}\n\n`;
	markdown += blocksToMarkdown(blocks);

	// Render mermaid diagrams
	if (mermaidBlocks.length > 0) {
		if (verbose) console.log("Rendering Mermaid diagrams...");
		const renderedImages = await renderAllMermaidBlocks(mermaidBlocks, {
			format: imageFormat,
			theme,
			outputDir: imagesDir,
		});

		if (renderedImages.length < mermaidBlocks.length) {
			const failedCount = mermaidBlocks.length - renderedImages.length;
			console.warn(
				`Warning: ${failedCount} mermaid diagram(s) failed to render`,
			);
		}

		if (verbose) console.log(`Rendered ${renderedImages.length} diagram(s)`);

		// Update markdown with image paths (relative to workDir)
		markdown = updateMarkdownWithImages(markdown, renderedImages, {
			pathPrefix: "images/",
		});
	}

	// Generate output
	let finalOutputPath: string;

	try {
		switch (outputFormat) {
			case "pdf":
				if (verbose) console.log("Generating PDF...");
				finalOutputPath = join(workDir, `${safeTitle}.pdf`);
				await markdownToPdf(markdown, workDir, {
					theme,
					outputPath: finalOutputPath,
					customCss,
				});
				break;

			case "html":
				if (verbose) console.log("Generating HTML...");
				finalOutputPath = join(workDir, `${safeTitle}.html`);
				await markdownToHtml(markdown, workDir, {
					theme,
					outputPath: finalOutputPath,
					customCss,
				});
				break;
			default:
				if (verbose) console.log("Saving Markdown...");
				finalOutputPath = join(workDir, `${safeTitle}.md`);
				await saveMarkdown(markdown, finalOutputPath);
				break;
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		if (outputFormat === "pdf") {
			return err({
				type: "PDF_ERROR",
				message: `Failed to generate PDF: ${errorMessage}`,
			});
		}

		return err({
			type: "IO_ERROR",
			message: `Failed to generate output: ${errorMessage}`,
		});
	}

	return ok({
		outputPath: finalOutputPath,
		mermaidCount: mermaidBlocks.length,
		success: true,
	});
}
