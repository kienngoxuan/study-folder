const fs = require('fs');
const path = require('path');

const samplesDir = 'content';
const subDirs = ['Math', 'Science', 'Literature/Classics', 'Projects/2024'];
const extensions = ['txt', 'md', 'pdf', 'ipynb']; // We won't generate real PDFs/IPYNBs but empty files with ext

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir);
}

// Create directories
subDirs.forEach(dir => {
  const fullPath = path.join(samplesDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Create files
const files = [
  { path: 'Math/Calculus_Notes.txt', content: 'Derivatives and Integrals...' },
  { path: 'Math/Algebra_Homework.pdf', content: '%PDF-1.5... (fake)' },
  { path: 'Science/Lab_Report_Biology.md', content: '# Lab Report\n\nResult: Success.' },
  { path: 'Literature/Classics/Moby_Dick_Summary.txt', content: 'Call me Ishmael.' },
  { path: 'Literature/Essay_Draft.docx', content: '(Binary data)' },
  { path: 'Projects/2024/Experiment_Analysis.ipynb', content: '{"cells": [], "metadata": {}, "nbformat": 4, "nbformat_minor": 5}' },
  { path: 'Projects/2024/dataset.csv', content: 'id,value\n1,100\n2,200' },
  { path: 'readme.txt', content: 'Welcome to my study folder.' }
];

files.forEach(f => {
  const fullPath = path.join(samplesDir, f.path);
  // Ensure dir exists (for ones not in subDirs list if any)
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(fullPath, f.content);
  console.log(`Created ${fullPath}`);
});

// Create a fake image (using sharp if possible, or just copy a pixel?)
// We have sharp installed.
const sharp = require('sharp');

async function createImages() {
    await sharp({
        create: {
            width: 800,
            height: 600,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
    })
    .png()
    .toFile(path.join(samplesDir, 'Science/Cell_Diagram.png'));

    await sharp({
        create: {
            width: 5000,
            height: 5000,
            channels: 4,
            background: { r: 0, g: 255, b: 0, alpha: 1 }
        }
    })
    .png()
    .toFile(path.join(samplesDir, 'Projects/2024/Large_Map.png'));

    console.log('Created sample images.');
}

createImages().catch(console.error);
