"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileInputProps {
  id: string;
  name?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect?: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
  label?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * FileInput component displaying selected file name, formatted size, and inline validation errors.
 */
export const FileInput: React.FC<FileInputProps> = ({
  id,
  name,
  accept,
  maxSizeMb = 10,
  onFileSelect,
  disabled = false,
  className,
  error: customError,
  label = "Choose file",
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const error = customError || internalError;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInternalError(null);

    if (file && maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      const err = `File exceeds the maximum allowed size of ${maxSizeMb} MB.`;
      setInternalError(err);
      setSelectedFile(null);
      if (onFileSelect) onFileSelect(null);
      return;
    }

    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="sr-only"
        aria-describedby={error ? `${id}-error` : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "inline-flex h-11 min-h-[44px] items-center gap-2 rounded-md border border-rule-strong bg-surface px-4 text-sm font-medium text-ink",
            "transition-colors duration-120 hover:border-ink-2 hover:bg-paper",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <Upload className="h-4 w-4 text-ink-2" strokeWidth={1.5} />
          <span>{label}</span>
        </button>

        <span className="text-sm text-ink-2">
          {selectedFile ? (
            <span className="font-mono text-ink">
              {selectedFile.name} ({formatBytes(selectedFile.size)})
            </span>
          ) : (
            "No file chosen"
          )}
        </span>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
