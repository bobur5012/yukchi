"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

async function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Blob failed"))), "image/jpeg", 0.9);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

async function processImageToFile(file: File): Promise<File> {
  const cropped = await cropToSquare(file);
  const croppedFile = new File([cropped], file.name, { type: "image/jpeg" });
  return imageCompression(croppedFile, { maxSizeMB: 0.2, maxWidthOrHeight: 400, useWebWorker: true });
}

async function processImageToBase64(file: File): Promise<string> {
  const compressed = await processImageToFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
}

interface AvatarPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  /** When provided, uploads file to storage and passes URL instead of base64 */
  onUpload?: (file: File) => Promise<string>;
}

export function AvatarPicker({ value, onChange, placeholder = "?", className, onUpload }: AvatarPickerProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      if (onUpload) {
        setUploading(true);
        const processed = await processImageToFile(file);
        const url = await onUpload(processed);
        onChange(url);
      } else {
        onChange(await processImageToBase64(file));
      }
    } catch {
      onChange(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Avatar preview — tap to open gallery */}
      <button type="button" onClick={() => !uploading && galleryRef.current?.click()} className="relative group" disabled={uploading}>
        <Avatar className="size-[80px]">
          {value ? <AvatarImage src={value} alt="Аватар" /> : null}
          <AvatarFallback className="text-[22px] font-semibold bg-muted text-muted-foreground">
            {placeholder}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <span className="text-white text-xs">...</span>
          ) : (
            <ImagePlus className="size-5 text-white" />
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex gap-2">
        <input ref={galleryRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFile} />

        <Button type="button" variant="secondary" size="sm" className="h-[36px] rounded-[10px] text-[13px]" onClick={() => galleryRef.current?.click()} disabled={uploading}>
          <ImagePlus className="size-3.5" />Галерея
        </Button>
        <Button type="button" variant="secondary" size="sm" className="h-[36px] rounded-[10px] text-[13px]" onClick={() => cameraRef.current?.click()} disabled={uploading}>
          <Camera className="size-3.5" />Камера
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="h-[36px] rounded-[10px] text-[13px] text-destructive" onClick={() => onChange(null)}>
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
