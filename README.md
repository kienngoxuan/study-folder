# Study Folder

A static, SSG-built GitHub Pages site that mirrors a local folder tree and provides a browsable, fast, SSG-built UI for files, notebooks, images and project folders.

## Features

- **Mirrors local folders**: Recursively scans your repository and generates a browsable UI.
- **Fast Client-side Search**: Instant filtering by name, type, and size.
- **Thumbnails**: Automatically generates thumbnails for large images.
- **File Previews**: Inline previews for images and text; links to GitHub renderers for Notebooks and PDFs.
- **Responsive Design**: Works on desktop and mobile.

## Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/study-folder.git
   cd study-folder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add Content**
   Place your study materials (notes, images, PDFs) in the `content/` folder (or configure `scripts/scan.js` and `.eleventy.js` to point elsewhere).

4. **Build and Serve Locally**
   ```bash
   # Scan files and start local server
   npm run build
   npm run serve
   ```
   Open `http://localhost:8080` to browse.

5. **Deploy to GitHub Pages**
   - Push your changes to the `main` branch.
   - The included GitHub Actions workflow will automatically build and deploy to the `gh-pages` branch.
   - Go to your repo Settings > Pages and select source as `gh-pages` branch.

## Configuration

### `scripts/scan.js`
Adjust the constants at the top of the file:
- `imagePreviewThresholdBytes`: Max size before using a thumbnail (default 1MB).
- `imageMaxDimension`: Max dimension before using a thumbnail (default 4096px).

### `.eleventy.js`
- Ensure `eleventyConfig.addPassthroughCopy({ "content": "content" });` matches your content folder name if you change it.

## File Type Handling

- **Images**: Shown as thumbnails if large. Click to preview.
- **Notebooks (.ipynb)**: Linked to GitHub Viewer.
- **PDFs**: Linked to raw file (browser viewer).
- **Text/Code**: Previewed in modal (first 2KB).

## Troubleshooting

- **Thumbnails not showing?** Ensure `npm run scan` ran successfully and `src/assets/thumbnails` is populated.
- **Files returning 404?** Ensure your content folder is being copied to `_site` via `.eleventy.js`.

## License

MIT
