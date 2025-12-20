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

// Simple Result type (replaces neverthrow)
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type AppResult<T> = Result<T, AppError>;

export function ok<T>(value: T): { ok: true; value: T } {
	return { ok: true, value };
}

export function err<E>(error: E): { ok: false; error: E } {
	return { ok: false, error };
}
