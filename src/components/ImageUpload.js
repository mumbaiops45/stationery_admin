"use client";

import { useRef, useState } from "react";

import { Alert, Button, Input } from "@/components/ui";
import { uploadImage, uploadTarget, validateImage } from "@/services/upload.service";

const HINTS = {
  api: "Uploaded to your API · JPG, PNG, WebP up to 8 MB",
  cloudinary: "Uploaded to Cloudinary · JPG, PNG, WebP up to 8 MB",
  inline: "Resized in your browser and saved with the record · JPG, PNG, WebP",
};

/**
 * Picks an image from a folder (or a drop), hands it to the upload service and
 * stores the resulting URL.
 *
 * `value` is the image URL held by the parent form; `onChange` receives the new
 * URL, or "" when cleared. Pasting a URL stays available either way.
 */
export default function ImageUpload({ value, onChange, label = "Image" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const target = uploadTarget();
  const uploading = progress !== null;
  const isInline = value?.startsWith("data:");

  async function handleFile(file) {
    if (!file) return;
    setError("");

    const invalid = validateImage(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    setProgress(0);
    try {
      const url = await uploadImage(file, { onProgress: setProgress });
      onChange(url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>

      {value ? (
        <div className="flex items-center gap-4 rounded-xl border border-line bg-canvas p-3">
          {/* Any host, or a data URL — next/image would need each remote host
              whitelisted in next.config, so a plain img is used here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Selected"
            className="h-20 w-20 shrink-0 rounded-lg border border-line bg-white object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-ink-soft">
              {isInline ? "Stored with the record (inline image)" : value}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => {
                  setError("");
                  onChange("");
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragging
              ? "border-brand-purple bg-brand-purple/5"
              : "border-line bg-canvas"
          }`}
        >
          {uploading ? (
            <div className="px-2">
              <p className="text-sm font-medium text-ink">
                {target.kind === "inline" ? "Processing" : "Uploading"}… {progress}%
              </p>
              <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-card">
                <span
                  className="block h-full rounded-full bg-brand-purple transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </div>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                className="mx-auto h-8 w-8 text-ink-soft"
                fill="none"
              >
                <path
                  d="M12 16V4m0 0L8 8m4-4l4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 15v3.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => inputRef.current?.click()}
              >
                Choose from your computer
              </Button>

              <p className="mt-2 text-xs text-ink-soft">or drop a file here</p>
              <p className="mt-1 text-[11px] text-ink-soft/80">
                {HINTS[target.kind]}
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {!isInline ? (
        <div className="mt-2">
          <Input
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder="…or paste an image URL"
          />
        </div>
      ) : null}

      {error ? (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}
