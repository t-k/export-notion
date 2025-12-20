import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mdToPdf } from "md-to-pdf";
import type { Theme } from "./types.js";

export interface PdfOptions {
	theme: Theme;
	outputPath: string;
	customCss?: string;
}

// Get CSS for theme
function getThemeCss(theme: Theme): string {
	const baseStyles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    pre {
      background: #f4f4f4;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 16px;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #f4f4f4;
    }
  `;

	const darkStyles = `
    body {
      background: #1e1e1e;
      color: #d4d4d4;
    }
    pre, code {
      background: #2d2d2d;
    }
    blockquote {
      border-left-color: #444;
      color: #aaa;
    }
    th, td {
      border-color: #444;
    }
    th {
      background: #2d2d2d;
    }
  `;

	if (theme === "dark") {
		return baseStyles + darkStyles;
	}

	return baseStyles;
}

// Convert markdown to PDF
export async function markdownToPdf(
	markdown: string,
	imagesDir: string,
	options: PdfOptions,
): Promise<string> {
	const { theme, outputPath, customCss } = options;
	const css = customCss || getThemeCss(theme);

	// Ensure output directory exists
	await mkdir(dirname(outputPath), { recursive: true });

	// md-to-pdf needs the markdown as content
	const pdf = await mdToPdf(
		{ content: markdown },
		{
			basedir: imagesDir,
			css,
			pdf_options: {
				format: "A4",
				margin: {
					top: "20mm",
					bottom: "20mm",
					left: "20mm",
					right: "20mm",
				},
				printBackground: true,
			},
		},
	);

	if (pdf.content) {
		await writeFile(outputPath, pdf.content);
		return outputPath;
	}

	throw new Error("Failed to generate PDF");
}

// Save markdown to file
export async function saveMarkdown(
	markdown: string,
	outputPath: string,
): Promise<string> {
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, markdown, "utf-8");
	return outputPath;
}

// Convert markdown to HTML
export async function markdownToHtml(
	markdown: string,
	imagesDir: string,
	options: PdfOptions,
): Promise<string> {
	const { theme, outputPath, customCss } = options;
	const css = customCss || getThemeCss(theme);

	await mkdir(dirname(outputPath), { recursive: true });

	const pdf = await mdToPdf(
		{ content: markdown },
		{
			basedir: imagesDir,
			css,
			as_html: true,
		},
	);

	if (pdf.content) {
		// pdf.content is Buffer when as_html is true
		const htmlContent = Buffer.isBuffer(pdf.content)
			? pdf.content.toString("utf-8")
			: String(pdf.content);
		await writeFile(outputPath, htmlContent, "utf-8");
		return outputPath;
	}

	throw new Error("Failed to generate HTML");
}
