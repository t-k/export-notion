# export-notion

Export Notion pages to PDF with rendered Mermaid diagrams.

Solves the problem where Notion's built-in export doesn't render Mermaid diagrams.

## Features

- Fetch page content via Notion API
- Render Mermaid diagrams as SVG/PNG images
- Export to PDF, HTML, or Markdown
- Multiple theme support (default, dark, forest, neutral)
- Custom CSS for PDF/HTML styling

## Installation

```bash
# Run directly with npx (no install needed)
npx export-notion <page-id> ./output

# Or install globally
npm install -g export-notion
```

## Notion Integration Setup

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Enter a name and create
4. Copy the "Internal Integration Token"
5. Open the Notion page you want to export
6. Click "..." (top right) -> "Connections" -> Add your integration

## Usage

```bash
# Set token via environment variable
export NOTION_TOKEN="your-integration-token"

# Export to PDF (default)
npx export-notion <page-id-or-url> ./output

# Export to Markdown
npx export-notion <page-id-or-url> ./output -f md

# Export to HTML
npx export-notion <page-id-or-url> ./output -f html

# With options
npx export-notion <page-id-or-url> ./output -f pdf -t dark -i png -v
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | Output format: pdf, md, html | pdf |
| `-i, --image-format` | Mermaid image format: svg, png | svg |
| `-t, --theme` | Theme: default, dark, forest, neutral | default |
| `-v, --verbose` | Verbose output | false |
| `--token` | Notion API token (alternative to env var) | - |
| `--css` | Custom CSS file for PDF/HTML styling | - |

### Page ID Formats

You can specify the page in any of these formats:

```bash
# Page ID (32-character hex string)
npx export-notion abc123def456... ./output

# UUID format
npx export-notion abc123de-f456-... ./output

# Notion URL
npx export-notion "https://www.notion.so/My-Page-abc123def456..." ./output
```

## Output Structure

```
output/
└── My-Page/
    ├── My-Page.pdf
    └── images/
        ├── mermaid-block1.svg
        └── mermaid-block2.svg
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
node dist/cli.js <page-id> ./output
```

## Custom CSS

You can customize the PDF/HTML output with your own CSS:

```bash
npx export-notion <page-id> ./output --css custom.css
```

Example `custom.css`:

```css
body {
  font-family: "Noto Sans JP", sans-serif;
  line-height: 1.8;
  max-width: 800px;
  margin: 0 auto;
}

h1, h2, h3 {
  color: #333;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}
```

## License

ISC
