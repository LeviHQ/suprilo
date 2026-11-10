"use client";

import * as React from "react";
import { X, ZoomIn, ZoomOut, Check, AlertCircle, Loader2, Crop } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AvatarCropModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => Promise<void> | void;
  isUploading?: boolean;
}

const MIN_DIMENSION = 128;
const OUTPUT_SIZE = 512; // Standard high-DPI square avatar canvas size

export function AvatarCropModal({
  isOpen,
  file,
  onClose,
  onCropComplete,
  isUploading = false,
}: AvatarCropModalProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = React.useState<number>(1);
  const [position, setPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [error, setError] = React.useState<string | null>(null);

  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Validate and read file into memory object URL
  React.useEffect(() => {
    if (!isOpen || !file) {
      setImageSrc(null);
      setNaturalDimensions(null);
      setError(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    // MIME type check
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError("Only JPG, PNG, and WebP images are allowed. SVG and GIF are not supported.");
      return;
    }

    // Size limit check (1MB)
    if (file.size > 1024 * 1024) {
      setError("File size exceeds 1 MB. Please choose a smaller image.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
        setError(`Image resolution is too small (${img.naturalWidth}×${img.naturalHeight}px). Minimum required is ${MIN_DIMENSION}×${MIN_DIMENSION}px.`);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageSrc(objectUrl);
      setError(null);
    };

    img.onerror = () => {
      setError("Invalid or corrupted image file. Please select a valid photo.");
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, file]);

  // Lock body scroll and handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isUploading]);

  // Mouse / Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isUploading) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isUploading) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isUploading || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isUploading || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Perform square crop on offscreen HTML5 canvas
  const handleApplyCrop = async () => {
    if (!imageRef.current || !containerRef.current || isUploading) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Canvas initialization failed.");
        return;
      }

      const img = imageRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Visual crop viewport is containerRect.width x containerRect.height (280x280px)
      const viewportSize = containerRect.width;

      // Compute display dimensions of the image inside the viewport
      const displayedWidth = img.width * scale;
      const displayedHeight = img.height * scale;

      // Offset from top-left of image to center of viewport
      const imgCenterOffsetX = (viewportSize - displayedWidth) / 2 + position.x;
      const imgCenterOffsetY = (viewportSize - displayedHeight) / 2 + position.y;

      // Ratio of natural dimensions to displayed dimensions
      const ratio = img.naturalWidth / displayedWidth;

      // Coordinates on the source image corresponding to the viewport
      const sx = Math.max(0, -imgCenterOffsetX * ratio);
      const sy = Math.max(0, -imgCenterOffsetY * ratio);
      const sWidth = Math.min(img.naturalWidth - sx, viewportSize * ratio);
      const sHeight = Math.min(img.naturalHeight - sy, viewportSize * ratio);

      // Destination dimensions on canvas
      const sDim = Math.min(sWidth, sHeight);

      // Draw high quality smoothed image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill white background for transparent images
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      ctx.drawImage(img, sx, sy, sDim, sDim, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Export as webp blob (fallback to jpeg if browser lacks webp canvas export)
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setError("Failed to create cropped image blob.");
            return;
          }
          if (blob.size > 1024 * 1024) {
            setError("Cropped image exceeds 1MB. Try zooming in or reducing source dimensions.");
            return;
          }
          await onCropComplete(blob);
        },
        "image/webp",
        0.92
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cropping image.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isUploading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-left space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-warm-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 text-brand-pink flex items-center justify-center shadow-xs">
              <Crop className="w-4 h-4" />
            </span>
            <div>
              <h3 id="crop-modal-title" className="text-base font-bold text-brand-dark tracking-normal">
                Crop Creator Avatar
              </h3>
              <p className="text-[11px] text-brand-muted">Drag to position, slider to zoom</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close crop modal"
            className="p-1.5 text-brand-muted hover:text-brand-dark rounded-xl hover:bg-brand-warm transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Crop Viewport */}
        {imageSrc && !error && (
          <div className="space-y-4">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-[280px] h-[280px] mx-auto rounded-3xl overflow-hidden bg-neutral-900 border-2 border-brand-pink/30 shadow-inner cursor-grab active:cursor-grabbing select-none"
            >
              {/* Image Preview Layer */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.05s ease-out",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  className="max-w-none max-h-none object-contain pointer-events-none"
                  style={{
                    width: naturalDimensions ? `${naturalDimensions.width}px` : "auto",
                    height: naturalDimensions ? `${naturalDimensions.height}px` : "auto",
                    maxWidth: "280px",
                    maxHeight: "280px",
                  }}
                />
              </div>

              {/* Circular Avatar Mask Overlay */}
              <div
                className="absolute inset-0 pointer-events-none ring-4 ring-white/90 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                aria-hidden="true"
              />
            </div>

            {/* Zoom Slider Controls */}
            <div className="space-y-1.5 px-2">
              <div className="flex items-center justify-between text-xs text-brand-muted font-medium">
                <span className="flex items-center gap-1">
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>Zoom</span>
                </span>
                <span>{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(1, s - 0.2))}
                  disabled={scale <= 1 || isUploading}
                  className="p-1 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-warm disabled:opacity-40"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={scale}
                  disabled={isUploading}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-brand-warm-border rounded-lg appearance-none cursor-pointer accent-brand-pink"
                />
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(3, s + 0.2))}
                  disabled={scale >= 3 || isUploading}
                  className="p-1 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-warm disabled:opacity-40"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-center text-brand-muted">
              Square output: 512×512px • Optimized WebP format
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 justify-center text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApplyCrop}
            disabled={!imageSrc || Boolean(error) || isUploading}
            className="flex-1 justify-center gap-2 text-xs shadow-md"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Apply & Save</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

