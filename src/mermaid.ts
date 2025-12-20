import { spawn } from "node:child_process";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ImageFormat,
	MermaidBlock,
	RenderedImage,
	Theme,
} from "./types.js";

export interface MermaidRenderOptions {
	format: ImageFormat;
	theme: Theme;
	outputDir: string;
}

// Get path to local mmdc binary
async function getMmdcPath(): Promise<string> {
	// Use import.meta.resolve to find the mermaid-cli module
	const mermaidCliUrl = import.meta.resolve("@mermaid-js/mermaid-cli");
	const mermaidCliPath = fileURLToPath(mermaidCliUrl);
	const mermaidCliDir = dirname(mermaidCliPath);
	// The main export is src/index.js, bin is src/cli.js in the same directory
	return join(mermaidCliDir, "cli.js");
}

// Run command and return result
function runCommand(
	command: string,
	args: string[],
): Promise<{ exitCode: number; stderr: string }> {
	return new Promise((resolve) => {
		const proc = spawn(command, args);
		let stderr = "";

		proc.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		proc.on("close", (code) => {
			resolve({ exitCode: code ?? 1, stderr });
		});

		proc.on("error", (err) => {
			resolve({ exitCode: 1, stderr: err.message });
		});
	});
}

// Render a single mermaid block
export async function renderMermaidBlock(
	block: MermaidBlock,
	options: MermaidRenderOptions,
): Promise<RenderedImage | null> {
	const { format, theme, outputDir } = options;
	const tempFile = join(outputDir, `.temp-${block.blockId}.mmd`);
	const outputFile = join(outputDir, `mermaid-${block.blockId}.${format}`);

	try {
		await mkdir(outputDir, { recursive: true });

		// Write mermaid content to temp file
		await writeFile(tempFile, block.content, "utf-8");

		const bgColor = theme === "dark" ? "#1e1e1e" : "transparent";

		// Run mmdc via node (cli.js is an ES module)
		const mmdcPath = await getMmdcPath();
		const result = await runCommand(process.execPath, [
			mmdcPath,
			"-i",
			tempFile,
			"-o",
			outputFile,
			"-t",
			theme,
			"-b",
			bgColor,
		]);

		// Clean up temp file
		await unlink(tempFile).catch(() => {});

		if (result.exitCode !== 0) {
			console.error(
				`Failed to render mermaid block ${block.blockId}:`,
				result.stderr,
			);
			return null;
		}

		return {
			blockId: block.blockId,
			path: outputFile,
			format,
		};
	} catch (error) {
		await unlink(tempFile).catch(() => {});
		console.error(`Error rendering mermaid block ${block.blockId}:`, error);
		return null;
	}
}

// Render all mermaid blocks
export async function renderAllMermaidBlocks(
	blocks: MermaidBlock[],
	options: MermaidRenderOptions,
): Promise<RenderedImage[]> {
	const results: RenderedImage[] = [];

	for (const block of blocks) {
		const result = await renderMermaidBlock(block, options);
		if (result) {
			results.push(result);
		}
	}

	return results;
}

export interface UpdateMarkdownOptions {
	/** Prefix to add to image paths (e.g., "images/") */
	pathPrefix?: string;
}

// Update markdown with rendered image paths
export function updateMarkdownWithImages(
	markdown: string,
	images: RenderedImage[],
	options: UpdateMarkdownOptions = {},
): string {
	const { pathPrefix = "" } = options;
	let result = markdown;

	for (const image of images) {
		// Replace placeholder with actual image path
		const placeholder = `mermaid-${image.blockId}.svg`;
		const actualPath = `${pathPrefix}mermaid-${image.blockId}.${image.format}`;
		result = result.replace(placeholder, actualPath);
	}

	return result;
}
