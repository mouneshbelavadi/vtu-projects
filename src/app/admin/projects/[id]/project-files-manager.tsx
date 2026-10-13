"use client";

import * as React from "react";
import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  createUploadUrl,
  finalizeUpload,
  deleteProjectFile,
} from "./files/actions";
import {
  PROJECT_FILE_KINDS,
  type Project,
  type ProjectFile,
  type ProjectFileKind,
} from "@/types/database";

interface ProjectFilesManagerProps {
  project: Project;
  files: ProjectFile[];
}

const KIND_METADATA: Record<
  ProjectFileKind,
  { label: string; allowedExts: string; helpText: string }
> = {
  code: {
    label: "Source Code Package (.zip)",
    allowedExts: ".zip",
    helpText: "Runnable code archive (.zip only). Magic bytes must match PK.",
  },
  setup_guide: {
    label: "Setup Guide (.pdf, .docx)",
    allowedExts: ".pdf,.docx",
    helpText: "Installation instructions (.pdf or .docx).",
  },
  viva_qa: {
    label: "Viva Examination Q&A (.pdf, .docx)",
    allowedExts: ".pdf,.docx",
    helpText: "Curated viva questions with answers (.pdf or .docx).",
  },
  report: {
    label: "Report Template (.pdf, .docx)",
    allowedExts: ".pdf,.docx",
    helpText: "VTU standard format documentation (.pdf or .docx).",
  },
  ppt: {
    label: "Presentation Slides (.pptx)",
    allowedExts: ".pptx",
    helpText: "Seminar/viva presentation deck (.pptx only).",
  },
  other: {
    label: "Other Resource (.zip, .pdf, .txt, .md)",
    allowedExts: ".zip,.pdf,.txt,.md",
    helpText: "Supporting datasets or documentation.",
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ProjectFilesManager({ project, files }: ProjectFilesManagerProps) {
  const [selectedKind, setSelectedKind] = React.useState<ProjectFileKind>("code");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progressText, setProgressText] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);

  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setProgressText("Requesting signed upload URL from server...");

    try {
      // Step 1: Create signed upload URL
      const urlRes = await createUploadUrl({
        projectId: project.id,
        kind: selectedKind,
        fileName: selectedFile.name,
        size: selectedFile.size,
        contentType: selectedFile.type || "application/octet-stream",
      });

      if (!urlRes.success || !urlRes.signedUrl || !urlRes.path) {
        throw new Error(urlRes.message || "Failed to generate signed upload URL.");
      }

      const { signedUrl, path: storagePath } = urlRes;

      // Step 2: Upload straight to storage with plain text progress
      setProgressText("Uploading: 0%");

      const formData = new FormData();
      formData.append("cacheControl", "3600");
      formData.append("", selectedFile);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setProgressText(`Uploading: ${percent}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage transfer failed with status ${xhr.status}.`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network failure during file upload to storage."));
        };

        xhr.send(formData);
      });

      // Step 3: Finalize upload and verify signature
      setProgressText("Verifying file signature (magic bytes) on server...");

      const finalizeRes = await finalizeUpload({
        projectId: project.id,
        kind: selectedKind,
        storagePath,
        originalName: selectedFile.name,
      });

      if (!finalizeRes.success) {
        throw new Error(
          finalizeRes.message || "File validation failed. Invalid signature or corrupted file."
        );
      }

      setUploadSuccess(
        `Successfully uploaded and verified ${selectedFile.name} as ${KIND_METADATA[selectedKind].label}.`
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      setProgressText(null);
    }
  };

  const handleDelete = (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteProjectFile(project.id, fileId);
      if (!res.success) {
        setDeleteError(res.message || "Failed to delete file.");
      }
    });
  };

  const handleStartReplace = (kind: ProjectFileKind) => {
    setSelectedKind(kind);
    setUploadError(null);
    setUploadSuccess(null);
    fileInputRef.current?.scrollIntoView({ behavior: "smooth" });
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-6 space-y-6 border-rule">
      <div>
        <h2 className="text-lg font-bold text-ink">Project Files ({files.length})</h2>
        <p className="mt-1 text-sm text-ink-2">
          Private project deliverables stored in encrypted private buckets. Uploads transfer directly to storage via signed URLs (up to 200 MB) and are verified by genuine file magic bytes.
        </p>
      </div>

      {deleteError && (
        <Alert variant="danger" title="File deletion error">
          {deleteError}
        </Alert>
      )}

      {/* Upload Box */}
      <div className="p-4 bg-paper rounded-md border border-rule space-y-4">
        <h3 className="text-sm font-bold text-ink">Upload Deliverable</h3>

        {uploadError && (
          <Alert variant="danger" title="Upload refused">
            {uploadError}
          </Alert>
        )}

        {uploadSuccess && (
          <Alert variant="success" title="Upload confirmed">
            {uploadSuccess}
          </Alert>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="file_kind"
              label="Deliverable Kind"
              helpText={KIND_METADATA[selectedKind].helpText}
              required
            >
              {({ id }) => (
                <select
                  id={id}
                  value={selectedKind}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSelectedKind(e.target.value as ProjectFileKind);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={isUploading}
                  className="flex h-11 min-h-[44px] w-full rounded-md border border-rule-strong bg-surface px-3 text-base text-ink focus:outline-accent"
                >
                  {PROJECT_FILE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND_METADATA[kind].label}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField
              id="file_input"
              label="Select File"
              helpText={`Allowed extensions: ${KIND_METADATA[selectedKind].allowedExts}. Max 200 MB.`}
              required
            >
              {({ id }) => (
                <input
                  ref={fileInputRef}
                  id={id}
                  type="file"
                  accept={KIND_METADATA[selectedKind].allowedExts}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  required
                  className="block w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-surface file:text-ink hover:file:bg-paper cursor-pointer border border-rule rounded-md p-1 bg-surface"
                />
              )}
            </FormField>
          </div>

          {/* Plain Text Upload Progress */}
          {progressText && (
            <div className="p-3 bg-accent-weak rounded border border-accent text-sm font-mono text-accent">
              Status: {progressText}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-ink-2">
              {selectedFile ? `${selectedFile.name} (${formatBytes(selectedFile.size)})` : "No file selected"}
            </span>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedFile || isUploading}
              isLoading={isUploading}
              loadingText="Uploading..."
            >
              Start Direct Upload
            </Button>
          </div>
        </form>
      </div>

      {/* Existing Files Table */}
      {files.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-rule rounded-md text-sm text-ink-2">
          No project files uploaded yet. Add source code, setup guide, and viva Q&A to satisfy go-live requirements.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Original Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>SHA-256 Checksum</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium text-ink whitespace-nowrap">
                    {KIND_METADATA[file.kind]?.label || file.kind}
                  </TableCell>
                  <TableCell className="text-ink font-mono text-xs max-w-xs truncate" title={file.original_name}>
                    {file.original_name}
                  </TableCell>
                  <TableCell className="text-ink-2 text-xs whitespace-nowrap">
                    {formatBytes(file.size_bytes)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-paper border border-rule text-ink">
                      v{file.version}
                    </span>
                  </TableCell>
                  <TableCell className="text-ink-2 font-mono text-[11px] max-w-[140px] truncate" title={file.sha256 || "File exceeds 25 MB; sha256 omitted"}>
                    {file.sha256 ? `${file.sha256.slice(0, 12)}...` : "N/A (> 25MB)"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-2">
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      onClick={() => handleStartReplace(file.kind)}
                      className="text-xs h-7 px-2"
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => handleDelete(file.id, file.original_name)}
                      className="text-xs h-7 px-2"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
