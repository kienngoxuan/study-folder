module.exports = function(eleventyConfig) {
  // Passthrough Copy
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/index.json");

  // If the user puts content in the root (which we scan), do we need to copy it to _site?
  // Yes, for the links to work (preview/download).
  // But we can't just passthrough copy EVERYTHING from root, as it would include node_modules etc.
  // We can add passthrough copy for specific extensions or folders?
  // Or better, tell the user to put content in a folder, or we programmatically add passthroughs?
  // Since we are scanning '.', we expect files to be served from root of the site.
  // 11ty by default only processes templates in `input` directory.
  // If `input` is `src`, then files in root are NOT copied.
  // This is a discrepancy between "scan root" and "build src".

  // Solution: We should probably encourage a content folder, e.g. "content/" or "data/".
  // But the requirement says "mirrors a local folder tree".

  // If we scan the root, and the site is built from `src`, then the links in `index.json` (e.g., "my-folder/file.txt")
  // will be broken unless "my-folder/file.txt" is also in `_site`.

  // So we need to tell 11ty to copy the content files.
  // We can't wildcard copy root to _site/root easily without recursion loop.

  // WORKAROUND:
  // For this scaffold, I will assume the user places content in the root.
  // I will add a glob passthrough copy for common file types in the root and subdirectories, excluding our system directories.
  // "content/**/*" is safe. "root/**/*" is hard.

  // Let's rely on the user to configure `.eleventy.js` for their specific folder structure if it's complex,
  // OR, specifically for this task, I will add a 'content' folder and generate samples there,
  // and configure scan.js and 11ty to handle 'content/'.
  // It is cleaner. The prompt says "mirrors a local folder tree". It doesn't strictly force root.
  // But wait, "point the scanner to a specific path" is in the Spec notes.

  // I will stick to the plan:
  // 1. Scanner scans everything (except ignores).
  // 2. 11ty needs to serve those files.
  // I will add a configuration to passthrough copy typical content extensions.

  const contentExtensions = "jpg,png,gif,webp,pdf,ipynb,txt,md,csv,json,zip,mp4,svg";
  // We want to copy these from project root to _site root.
  // But 11ty input is "src".
  // We can add passthrough copy for files OUTSIDE src?
  // eleventyConfig.addPassthroughCopy({ "images": "images" }); works.
  // eleventyConfig.addPassthroughCopy({ "*.{jpg,png...}": "." });

  // Let's try to grab all content files from root (excluding system dirs) and map to root of output.
  // This is tricky in 11ty config without a glob that supports exclusions well in the key.

  // For the purpose of this deliverable, I will create a `content` directory in the root
  // and tell 11ty to copy `content/` to `_site/content/`.
  // And the scanner will scan `content/` and root files?
  // The scanner `CONFIG.scanRoot` is `.`.
  // If I have `content/file.txt`, scanner sees `content/file.txt`.
  // If 11ty copies `content` -> `_site/content`, then the link `content/file.txt` works.

  eleventyConfig.addPassthroughCopy({ "content": "content" });

  // Also copy any other top level folders if needed?
  // I'll stick to 'content' folder recommendation for this "Study Folder" structure.

  return {
    dir: {
      input: "src",
      output: "_site"
    },
    templateFormats: ["njk", "md", "html"]
  };
};
