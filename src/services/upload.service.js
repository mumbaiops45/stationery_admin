import { getAccessToken } from "@/lib/api";

/**
 * The API has no upload route — it only stores `image.url` as a string — so a
 * picked file goes to whichever destination is configured, in this order:
 *
 *   1. NEXT_PUBLIC_UPLOAD_URL          your own endpoint, once it exists.
 *      multipart/form-data under the field name `image`, admin token attached.
 *      Any of { url } / { data.url } / { data.image.url } / { secure_url }
 *      is accepted back.
 *
 *   2. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 *      unsigned browser upload straight to Cloudinary — no backend work.
 *
 *   3. inline (the fallback, always available)
 *      the image is downscaled in the browser and stored as a data URL, so
 *      picking a file from a folder works with no configuration at all.
 *      Fine for small catalogues; move to 1 or 2 before the catalogue grows,
 *      since every listing response then carries the image bytes.
 */

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || "";
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // what may be picked
export const MAX_INLINE_BYTES = 400 * 1024; // what may be stored inline
export const INLINE_MAX_EDGE = 900; // px, longest side after downscaling

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export function uploadTarget() {
  if (UPLOAD_URL) {
    return { kind: "api", url: UPLOAD_URL, field: "image" };
  }
  if (CLOUD_NAME && UPLOAD_PRESET) {
    return {
      kind: "cloudinary",
      url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      field: "file",
    };
  }
  return { kind: "inline" };
}

export function validateImage(file) {
  if (!file) return "Choose a file first.";
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Use a JPG, PNG, WebP or AVIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 8 MB.`;
  }
  return null;
}

function pickUrl(payload) {
  return (
    payload?.secure_url ||
    payload?.url ||
    payload?.data?.url ||
    payload?.data?.secure_url ||
    payload?.data?.image?.url ||
    payload?.image?.url ||
    null
  );
}

/* ------------------------------------------------------------------ */
/* Inline storage: downscale on a canvas, encode as a data URL          */
/* ------------------------------------------------------------------ */

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    // from-image keeps the EXIF rotation of phone photos.
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("That file could not be read as an image."));
    };
    image.src = objectUrl;
  });
}

async function toInlineDataUrl(file, onProgress) {
  onProgress?.(15);
  const bitmap = await loadBitmap(file);

  const scale = Math.min(
    1,
    INLINE_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  // PNG transparency would go black on a JPEG, so paint a white ground.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  onProgress?.(60);

  // Step the quality down until it fits the inline budget.
  for (const quality of [0.82, 0.7, 0.6, 0.5, 0.4]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    // A data URL is ~4/3 the byte size it encodes.
    if (dataUrl.length * 0.75 <= MAX_INLINE_BYTES) {
      onProgress?.(100);
      return dataUrl;
    }
  }

  throw new Error(
    "This image is too detailed to store inline. Configure Cloudinary or an upload endpoint, or use a smaller image.",
  );
}

/* ------------------------------------------------------------------ */
/* Hosted upload                                                       */
/* ------------------------------------------------------------------ */

function postToHost(file, target, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append(target.field, file);

    if (target.kind === "cloudinary") {
      form.append("upload_preset", UPLOAD_PRESET);
    }

    const request = new XMLHttpRequest();
    request.open("POST", target.url);

    if (target.kind === "api") {
      request.withCredentials = true;
      const token = getAccessToken();
      if (token) request.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onerror = () =>
      reject(new Error("Upload failed — could not reach the image host."));

    request.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = null;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(
          new Error(
            payload?.message ||
              payload?.error?.message ||
              `Upload failed (${request.status}).`,
          ),
        );
        return;
      }

      const url = pickUrl(payload);
      if (!url) {
        reject(new Error("Upload succeeded but no image URL came back."));
        return;
      }

      resolve(url);
    };

    request.send(form);
  });
}

/** Resolves with the URL to store in `image.url`. */
export async function uploadImage(file, { onProgress } = {}) {
  const invalid = validateImage(file);
  if (invalid) throw new Error(invalid);

  const target = uploadTarget();

  if (target.kind === "inline") {
    return toInlineDataUrl(file, onProgress);
  }

  // XMLHttpRequest rather than fetch, because fetch cannot report progress.
  return postToHost(file, target, onProgress);
}
