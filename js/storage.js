// ═══════════════════════════════════════════════════
//  Team C.A.R.E — Firebase Storage Service
//  File: src/firebase/storage.js
//  Handles all file uploads: images, PDFs, videos
// ═══════════════════════════════════════════════════

import {
  ref, uploadBytesResumable, getDownloadURL,
  deleteObject, listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { storage } from './config.js';

// ── Allowed file types ──
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_PDF_TYPES   = ['application/pdf'];
const MAX_IMAGE_SIZE_MB   = 5;
const MAX_PDF_SIZE_MB     = 20;

// ── Validate file before upload ──
function validateFile(file, type = 'image') {
  const allowed = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_PDF_TYPES;
  const maxMB   = type === 'image' ? MAX_IMAGE_SIZE_MB  : MAX_PDF_SIZE_MB;

  if (!allowed.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`);
  }
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`File too large. Max ${maxMB}MB allowed.`);
  }
  return true;
}

// ── Generate clean filename ──
function cleanFilename(original) {
  const ext  = original.split('.').pop().toLowerCase();
  const name = original.replace(/\.[^.]+$/, '')
                       .replace(/[^a-zA-Z0-9]/g, '-')
                       .toLowerCase()
                       .slice(0, 40);
  return `${name}-${Date.now()}.${ext}`;
}

// ═══════════════════════════════════════
//  MAIN UPLOAD FUNCTION
//  Returns a Promise with { url, path }
//  Calls onProgress(0-100) during upload
// ═══════════════════════════════════════
export function uploadFile(file, folder = 'gallery', onProgress = null) {
  return new Promise((resolve, reject) => {
    try {
      const fileType = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'pdf';
      validateFile(file, fileType);

      const filename  = cleanFilename(file.name);
      const filePath  = `${folder}/${filename}`;
      const storageRef = ref(storage, filePath);

      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: 'admin',
          originalName: file.name
        }
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => {
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, path: filePath, filename });
        }
      );

    } catch (err) {
      reject(err);
    }
  });
}

// ═══════════════════════════════════════
//  DELETE FILE
// ═══════════════════════════════════════
export async function deleteFile(filePath) {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

// ═══════════════════════════════════════
//  LIST ALL FILES IN FOLDER
// ═══════════════════════════════════════
export async function listFiles(folder) {
  const folderRef = ref(storage, folder);
  const result = await listAll(folderRef);
  const files = await Promise.all(
    result.items.map(async (item) => ({
      name: item.name,
      path: item.fullPath,
      url: await getDownloadURL(item)
    }))
  );
  return files;
}

// ═══════════════════════════════════════
//  IMAGE UPLOAD WITH PREVIEW (UI Helper)
//  Use in admin panel drag-drop zones
// ═══════════════════════════════════════
export function setupImageUploadZone(dropZoneId, previewImgId, folder, onSuccess) {
  const dropZone  = document.getElementById(dropZoneId);
  const preview   = document.getElementById(previewImgId);
  if (!dropZone) return;

  // Click to browse
  dropZone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleUpload(e.target.files[0]);
    input.click();
  });

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleUpload(e.dataTransfer.files[0]);
  });

  async function handleUpload(file) {
    if (!file) return;

    // Show preview immediately (before upload)
    if (preview) {
      const reader = new FileReader();
      reader.onload = (e) => { preview.src = e.target.result; };
      reader.readAsDataURL(file);
    }

    // Show progress bar
    dropZone.innerHTML = `
      <div class="upload-progress">
        <div class="progress-bar" id="prog-${dropZoneId}"></div>
        <span class="progress-text">Uploading...</span>
      </div>`;

    try {
      const result = await uploadFile(file, folder, (progress) => {
        const bar = document.getElementById(`prog-${dropZoneId}`);
        if (bar) bar.style.width = `${progress}%`;
      });

      dropZone.innerHTML = `<span class="upload-success">✓ Uploaded</span>`;
      if (onSuccess) onSuccess(result);

    } catch (err) {
      dropZone.innerHTML = `<span class="upload-error">✗ ${err.message}</span>`;
    }
  }
}