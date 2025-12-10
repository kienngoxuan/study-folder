const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const sharp = require('sharp');
const { glob } = require('glob');

// Configuration
const CONFIG = {
  scanRoot: '.', // Scan from repo root
  ignore: [
    'node_modules/**',
    '.git/**',
    '_site/**',
    '.github/**',
    'scripts/**',
    'src/**', // Don't scan the app source
    'package.json',
    'package-lock.json',
    '.gitignore',
    '.eleventy.js',
    'AGENTS.md'
  ],
  outputFile: 'src/index.json',
  thumbnailDir: 'src/assets/thumbnails',
  thumbnailUrlPrefix: 'assets/thumbnails/',
  imagePreviewThresholdBytes: 1000000, // 1MB
  imageMaxDimension: 4096,
  thumbnailWidth: 400
};

// Ensure thumbnail directory exists
if (!fs.existsSync(CONFIG.thumbnailDir)) {
  fs.mkdirSync(CONFIG.thumbnailDir, { recursive: true });
}

// Helper: Calculate SHA1 checksum of a file
function getFileChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha1');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Helper: Get relative path safely
function getRelativePath(fullPath) {
  return path.relative(process.cwd(), fullPath).split(path.sep).join('/');
}

async function generateThumbnail(filePath, checksum) {
  const ext = path.extname(filePath).toLowerCase();
  const thumbnailFilename = `${checksum}.webp`;
  const thumbnailPath = path.join(CONFIG.thumbnailDir, thumbnailFilename);

  // Return existing thumbnail path if it exists
  if (fs.existsSync(thumbnailPath)) {
    return CONFIG.thumbnailUrlPrefix + thumbnailFilename;
  }

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Check if thumbnail generation is needed (size > 1MB OR dimensions > 4096)
    const stats = fs.statSync(filePath);
    const isLargeFile = stats.size > CONFIG.imagePreviewThresholdBytes;
    const isLargeDimensions = (metadata.width > CONFIG.imageMaxDimension || metadata.height > CONFIG.imageMaxDimension);

    if (isLargeFile || isLargeDimensions) {
      console.log(`Generating thumbnail for: ${filePath}`);
      await image
        .resize({ width: CONFIG.thumbnailWidth })
        .toFormat('webp')
        .toFile(thumbnailPath);
      return CONFIG.thumbnailUrlPrefix + thumbnailFilename;
    }
  } catch (err) {
    console.error(`Error generating thumbnail for ${filePath}:`, err.message);
  }
  return null;
}

async function scan() {
  console.log('Starting scan...');

  const files = await glob('**/*', {
    ignore: CONFIG.ignore,
    nodir: true,
    dot: false
  });

  const index = [];

  for (const f of files) {
    const filePath = path.resolve(f);
    const stats = fs.statSync(filePath);
    const relPath = getRelativePath(filePath);
    const fileName = path.basename(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const type = mimeType.split('/')[0]; // 'image', 'text', 'application', etc.

    // Determine simplified type
    let simpleType = 'other';
    if (type === 'image') simpleType = 'image';
    else if (fileName.endsWith('.ipynb')) simpleType = 'notebook';
    else if (mimeType === 'application/pdf') simpleType = 'pdf';
    else if (type === 'text') simpleType = 'text';

    // Basic metadata
    const item = {
      id: crypto.createHash('sha1').update(relPath).digest('hex'),
      name: fileName,
      path: relPath,
      type: simpleType,
      mime: mimeType,
      size_bytes: stats.size,
      updated_at: stats.mtime.toISOString(),
      thumbnail_path: null,
      preview_url: null, // Can be populated if needed, or constructed on client
      github_raw_url: null, // Constructed on client usually, or here if we know repo URL
      checksum: null // Only computing for images to save time, or all?
    };

    // For images, we might need a thumbnail
    if (simpleType === 'image') {
      // Compute checksum for thumbnail cache key
      item.checksum = getFileChecksum(filePath);
      item.thumbnail_path = await generateThumbnail(filePath, item.checksum);
    }

    index.push(item);
  }

  // Identify folders implicitly from file paths?
  // The spec says "Recursively scan repo folder(s) to produce metadata list... index.json (array of file/folder metadata)"
  // So we should also include folder entries?
  // "Layout: Responsive grid of folders/cards"
  // If we only list files, the client needs to reconstruct the tree.
  // The spec says: "Generate index.json (array of file/folder metadata)"
  // Let's add explicit folder entries.

  const folders = new Set();
  index.forEach(file => {
    let dir = path.dirname(file.path);
    while (dir !== '.') {
        folders.add(dir);
        dir = path.dirname(dir);
    }
  });

  const folderList = Array.from(folders).map(folderPath => {
    const stats = fs.statSync(path.resolve(folderPath));
    return {
      id: crypto.createHash('sha1').update(folderPath).digest('hex'),
      name: path.basename(folderPath),
      path: folderPath,
      type: 'folder',
      mime: null,
      size_bytes: 0, // aggregate size?
      updated_at: stats.mtime.toISOString(),
      thumbnail_path: null
    };
  });

  const fullIndex = [...folderList, ...index];

  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(fullIndex, null, 2));
  console.log(`Scanned ${files.length} files and ${folderList.length} folders. Index written to ${CONFIG.outputFile}`);
}

scan().catch(console.error);
