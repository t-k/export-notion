import type { Result } from "neverthrow";

export type OutputFormat = "pdf" | "md" | "html";
export type ImageFormat = "svg" | "png";
export type Theme = "default" | "dark" | "forest" | "neutral";

export interface ExportOptions {
	outputFormat: OutputFormat;
	imageFormat: ImageFormat;
	theme: Theme;
	outputPath: string;
	customCss?: string;
}

export interface NotionConfig {
	apiToken: string;
	pageId: string;
}

export interface MermaidBlock {
	content: string;
	blockId: string;
}

export interface RenderedImage {
	blockId: string;
	path: string;
	format: ImageFormat;
}

export interface ExportResult {
	outputPath: string;
	mermaidCount: number;
	success: boolean;
}

export type AppError =
	| { type: "NOTION_API_ERROR"; message: string }
	| { type: "RENDER_ERROR"; message: string }
	| { type: "PDF_ERROR"; message: string }
	| { type: "IO_ERROR"; message: string }
	| { type: "CONFIG_ERROR"; message: string };

export type AppResult<T> = Result<T, AppError>;
