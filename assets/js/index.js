
// State
let allItems = [];
let currentItems = []; // After filter/search
let currentPath = ''; // Root
let batchSize = 50;
let renderCount = 50;
let repoUrl = ''; // We can infer or set this. For now assume relative or construct.

// DOM Elements
const grid = document.getElementById('grid');
const breadcrumbs = document.getElementById('breadcrumbs');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalDownload = document.getElementById('modalDownloadLink');
const modalGithub = document.getElementById('modalGithubLink');
const closeBtn = document.querySelector('.close-btn');

// Initialization
async function init() {
  try {
    const response = await fetch('index.json');
    if (!response.ok) throw new Error('Failed to load index.json');
    allItems = await response.json();

    // Initial Render
    applyFilters();

    // Listeners
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    sortSelect.addEventListener('change', applyFilters);
    loadMoreBtn.addEventListener('click', loadMore);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Filter checkboxes
    document.querySelectorAll('.filters input').forEach(cb => {
        cb.addEventListener('change', applyFilters);
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p>Error loading index. Make sure you have run the build script.</p>';
  }
}

// Logic
function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const sortValue = sortSelect.value;
  const activeTypes = Array.from(document.querySelectorAll('.filters input:checked')).map(cb => cb.value);

  // 1. Filter by Path (current directory browsing) OR Search (global)
  // If search query exists, we search globally.
  // If no search query, we show current folder contents.

  let filtered = allItems;

  if (query.trim() !== '') {
    // Search Mode: Global search
    filtered = allItems.filter(item => {
      return (item.name.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)) &&
             activeTypes.includes(item.type);
    });
  } else {
    // Browse Mode: Filter by current path
    filtered = allItems.filter(item => {
        // Parent directory logic
        // If currentPath is '', we want items with no '/' in their RELATIVE path from root?
        // Wait, path in index.json is relative to repo root.
        // e.g. "foo.txt", "sub/bar.txt".
        // item.path is the full relative path.

        // We need to find items that are DIRECT children of currentPath.
        const itemDir = getParentDir(item.path);

        // Special case: we don't want to show the folder ITSELF in the list of its children
        if (item.path === currentPath && currentPath !== '') return false;

        return itemDir === currentPath && activeTypes.includes(item.type);
    });
  }

  // 2. Sort
  filtered.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    if (sortValue === 'name-asc') return a.name.localeCompare(b.name);
    if (sortValue === 'name-desc') return b.name.localeCompare(a.name);
    if (sortValue === 'date-desc') return new Date(b.updated_at) - new Date(a.updated_at);
    if (sortValue === 'size-desc') return b.size_bytes - a.size_bytes;
    return 0;
  });

  currentItems = filtered;
  renderCount = batchSize;
  renderGrid();
  renderBreadcrumbs();
}

function getParentDir(pathStr) {
    if (!pathStr.includes('/')) return '';
    return pathStr.substring(0, pathStr.lastIndexOf('/'));
}

function renderGrid() {
  grid.innerHTML = '';
  const toShow = currentItems.slice(0, renderCount);

  toShow.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => handleItemClick(item);

    let iconOrThumb = '';
    if (item.thumbnail_path) {
        iconOrThumb = `<img src="${item.thumbnail_path}" loading="lazy" alt="${item.name}">`;
    } else {
        iconOrThumb = `<div class="card-icon">${getIconForType(item.type)}</div>`;
    }

    card.innerHTML = `
      <div class="card-preview">${iconOrThumb}</div>
      <div class="card-body">
        <div class="card-title" title="${item.name}">${item.name}</div>
        <div class="card-meta">
           ${formatSize(item.size_bytes)} • ${new Date(item.updated_at).toLocaleDateString()}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  if (renderCount < currentItems.length) {
    loadMoreContainer.style.display = 'block';
  } else {
    loadMoreContainer.style.display = 'none';
  }
}

function loadMore() {
    renderCount += batchSize;
    renderGrid();
}

function renderBreadcrumbs() {
    if (searchInput.value.trim() !== '') {
        breadcrumbs.innerHTML = `<span>Search Results for "${searchInput.value}"</span>`;
        return;
    }

    const parts = currentPath ? currentPath.split('/') : [];
    let html = `<span onclick="navigateTo('')">Home</span>`;
    let accum = '';

    parts.forEach((part, index) => {
        if (!part) return;
        accum += (accum ? '/' : '') + part;
        if (index === parts.length - 1) {
             html += ` / <span class="current">${part}</span>`;
        } else {
             // Closure trap? No, accum string is by value.
             // But onClick needs to call navigateTo with the correct path.
             html += ` / <span onclick="navigateTo('${accum}')">${part}</span>`;
        }
    });
    breadcrumbs.innerHTML = html;
}

// Global scope for HTML access
window.navigateTo = function(path) {
    currentPath = path;
    searchInput.value = ''; // Clear search when navigating
    applyFilters();
}

function handleItemClick(item) {
    if (item.type === 'folder') {
        navigateTo(item.path);
    } else {
        openModal(item);
    }
}

function openModal(item) {
    modalBody.innerHTML = '';
    modal.classList.remove('hidden');

    // Actions
    // Assuming GitHub Pages, raw link is usually just the relative path if it's a static file?
    // Or if we want GitHub raw:
    // We don't have the repo URL in the client easily unless we baked it in.
    // But for the "Download" button, the relative path works on the served site.
    modalDownload.href = item.path;
    modalGithub.href = 'https://github.com'; // Placeholder, ideally specific to file.
    // To get real GH link we'd need 'github_raw_url' populated or repo info.

    if (item.type === 'image') {
        const img = document.createElement('img');
        // Use original path for full preview
        img.src = item.path;
        modalBody.appendChild(img);
    } else if (item.type === 'text') {
        fetch(item.path).then(r => r.text()).then(text => {
            const pre = document.createElement('pre');
            pre.textContent = text.substring(0, 2000) + (text.length > 2000 ? '...' : '');
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.overflow = 'auto';
            pre.style.maxHeight = '60vh';
            modalBody.appendChild(pre);
        });
    } else if (item.type === 'pdf') {
        modalBody.innerHTML = `<p>PDF Preview not fully implemented inline. <a href="${item.path}" target="_blank">Open PDF</a></p>`;
    } else {
         modalBody.innerHTML = `<p>File type: ${item.type}. <a href="${item.path}" target="_blank">Download/Open</a></p>`;
    }
}

function closeModal() {
    modal.classList.add('hidden');
    modalBody.innerHTML = '';
}

function getIconForType(type) {
    switch (type) {
        case 'folder': return '📁';
        case 'image': return '🖼️';
        case 'pdf': return '📄';
        case 'notebook': return '📓';
        case 'text': return '📝';
        default: return '📦';
    }
}

function formatSize(bytes) {
    if (bytes === 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return bytes.toFixed(1) + ' ' + units[i];
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

init();
