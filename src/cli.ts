#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { Command } from "commander";
import { exportNotionPage } from "./exporter.js";
import type { ImageFormat, OutputFormat, Theme } from "./types.js";
import { extractPageId } from "./utils.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

interface CliOptions {
	verbose: boolean;
	format: OutputFormat;
	imageFormat: ImageFormat;
	theme: Theme;
	token?: string;
	css?: string;
}

const program = new Command();

program
	.name("export-notion")
	.description("Export Notion pages with Mermaid diagrams rendered as images")
	.version(version)
	.argument("<page-id>", "Notion page ID or URL")
	.argument("<output>", "Output directory")
	.option("-v, --verbose", "Verbose output", false)
	.option("-f, --format <format>", "Output format: pdf, md, or html", "pdf")
	.option(
		"-i, --image-format <format>",
		"Image format for Mermaid: svg or png",
		"svg",
	)
	.option(
		"-t, --theme <theme>",
		"Theme: default, dark, forest, neutral",
		"default",
	)
	.option("--token <token>", "Notion API token (or set NOTION_TOKEN env var)")
	.option("--css <file>", "Custom CSS file for PDF/HTML styling")
	.action(async (pageIdOrUrl: string, output: string, options: CliOptions) => {
		// Get API token
		const apiToken = options.token || process.env.NOTION_TOKEN;
		if (!apiToken) {
			console.error("Error: Notion API token required.");
			console.error(
				"Set NOTION_TOKEN environment variable or use --token option.",
			);
			console.error("");
			console.error("To get a token:");
			console.error("1. Go to https://www.notion.so/my-integrations");
			console.error("2. Create a new integration");
			console.error("3. Copy the Internal Integration Token");
			console.error("4. Share your page with the integration");
			process.exit(1);
		}

		// Extract page ID from URL if needed
		const pageId = extractPageId(pageIdOrUrl);
		if (!pageId) {
			console.error(`Error: Invalid page ID or URL: ${pageIdOrUrl}`);
			process.exit(1);
		}

		// Validate options
		const validFormats: OutputFormat[] = ["pdf", "md", "html"];
		if (!validFormats.includes(options.format as OutputFormat)) {
			console.error(
				`Invalid format: ${options.format}. Use one of: ${validFormats.join(", ")}`,
			);
			process.exit(1);
		}

		const validImageFormats: ImageFormat[] = ["svg", "png"];
		if (!validImageFormats.includes(options.imageFormat as ImageFormat)) {
			console.error(
				`Invalid image format: ${options.imageFormat}. Use one of: ${validImageFormats.join(", ")}`,
			);
			process.exit(1);
		}

		const validThemes: Theme[] = ["default", "dark", "forest", "neutral"];
		if (!validThemes.includes(options.theme as Theme)) {
			console.error(
				`Invalid theme: ${options.theme}. Use one of: ${validThemes.join(", ")}`,
			);
			process.exit(1);
		}

		const outputPath = resolve(output);

		// Load custom CSS if specified
		let customCss: string | undefined;
		if (options.css) {
			try {
				customCss = await readFile(resolve(options.css), "utf-8");
			} catch {
				console.error(`Error: Failed to read CSS file: ${options.css}`);
				process.exit(1);
			}
		}

		if (options.verbose) {
			console.log(`Page ID: ${pageId}`);
			console.log(`Output: ${outputPath}`);
			console.log(`Format: ${options.format}`);
			console.log(`Image Format: ${options.imageFormat}`);
			console.log(`Theme: ${options.theme}`);
			if (customCss) {
				console.log(`Custom CSS: ${options.css}`);
			}
			console.log("");
		}

		const result = await exportNotionPage(
			{ apiToken, pageId },
			{
				outputFormat: options.format as OutputFormat,
				imageFormat: options.imageFormat as ImageFormat,
				theme: options.theme as Theme,
				outputPath,
				customCss,
			},
			options.verbose,
		);

		if (result.isOk()) {
			console.log("");
			console.log("Done!");
			console.log(`Output: ${result.value.outputPath}`);
			console.log(`Mermaid diagrams: ${result.value.mermaidCount}`);
		} else {
			console.error("");
			console.error("Export failed:", result.error);
			process.exit(1);
		}
	});

program.parse();
