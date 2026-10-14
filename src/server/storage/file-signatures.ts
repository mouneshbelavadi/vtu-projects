import "server-only";

export type ImageFormat = "png" | "jpeg" | "webp";

/**
 * Validates real magic byte signature of image buffers.
 * Refuses SVG, GIF, HTML, and any unrecognized or executable formats.
 */
export function detectImageSignature(buffer: Buffer): ImageFormat | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export type ProjectFileSignature = "zip" | "pdf" | "ooxml" | "text";

/**
 * Verifies real file signature from initial bytes of uploaded project files.
 * ZIP / OOXML start with 'PK' (0x50 0x4B)
 * PDF starts with '%PDF' (0x25 0x50 0x44 0x46)
 */
export function detectProjectFileSignature(buffer: Buffer): ProjectFileSignature | null {
  if (buffer.length < 4) return null;

  // PDF: %PDF
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "pdf";
  }

  // ZIP or OOXML (docx, pptx): PK.. (0x50 0x4B)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "zip";
  }

  // UTF-8 text/markdown check: ensure no binary null bytes in first 512 bytes
  const sample = buffer.subarray(0, Math.min(buffer.length, 512));
  let isBinary = false;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if (byte === 0x00) {
      isBinary = true;
      break;
    }
  }

  if (!isBinary) {
    return "text";
  }

  return null;
}

const BANNED_EXTENSIONS = new Set([
  "exe", "dll", "bat", "cmd", "sh", "com", "msi", "scr", "bin", "vbs", "ps1", "jar", "py", "php", "pl", "cgi", "html", "htm", "svg"
]);

function isExecutableSignature(buffer: Buffer): boolean {
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    // Windows PE / DOS 'MZ'
    return true;
  }
  if (buffer.length >= 4 && buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    // Linux ELF
    return true;
  }
  if (buffer.length >= 4 && buffer[0] === 0xca && buffer[1] === 0xfe && buffer[2] === 0xba && buffer[3] === 0xbe) {
    // Mach-O / Java class
    return true;
  }
  return false;
}

export interface FileValidationResult {
  valid: boolean;
  contentType: string;
  error?: string;
  errorMessage?: string;
}

function failResult(msg: string): FileValidationResult {
  return { valid: false, contentType: "", error: msg, errorMessage: msg };
}

export function validatePaymentProofBuffer(
  buffer: Buffer,
  _originalName?: string,
  _declaredMime?: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return failResult("File is empty or corrupted");
  }
  const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
  if (buffer.length > MAX_SIZE) {
    return failResult("Payment screenshot must be 3 MB or less");
  }
  const format = detectImageSignature(buffer);
  if (!format) {
    return failResult("Image is corrupted or unsupported format. Allowed formats: PNG, JPEG, or WebP");
  }
  return {
    valid: true,
    contentType: `image/${format}`,
  };
}

export function validateCustomReferenceFile(
  buffer: Buffer,
  originalName: string,
  _declaredMime?: string
): FileValidationResult {
  const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
  if (!buffer || buffer.length === 0) {
    return failResult("File is empty or corrupt");
  }
  if (buffer.length > MAX_SIZE) {
    return failResult("File exceeds 3 MB limit");
  }
  if (buffer.length < 4) {
    return failResult("File is empty or corrupt");
  }

  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  if (BANNED_EXTENSIONS.has(ext)) {
    return failResult("Executable or unsafe file extension is prohibited");
  }

  if (isExecutableSignature(buffer)) {
    return failResult("Executable binary signatures are strictly prohibited");
  }

  if (ext === "png") {
    if (detectImageSignature(buffer) === "png") {
      return { valid: true, contentType: "image/png" };
    }
    return failResult("PNG magic byte signature verification failed");
  }

  if (ext === "jpeg" || ext === "jpg") {
    if (detectImageSignature(buffer) === "jpeg") {
      return { valid: true, contentType: "image/jpeg" };
    }
    return failResult("JPEG magic byte signature verification failed");
  }

  if (ext === "pdf") {
    if (detectProjectFileSignature(buffer) === "pdf") {
      return { valid: true, contentType: "application/pdf" };
    }
    return failResult("PDF magic byte signature verification failed");
  }

  if (ext === "docx") {
    if (detectProjectFileSignature(buffer) === "zip") {
      return {
        valid: true,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }
    return failResult("DOCX archive signature verification failed");
  }

  if (ext === "txt") {
    if (detectProjectFileSignature(buffer) === "text") {
      // Disallow HTML disguised as text
      const sample = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf8").toLowerCase();
      if (sample.includes("<html") || sample.includes("<script") || sample.includes("<!doctype")) {
        return failResult("HTML or script content disguised as text is forbidden");
      }
      return { valid: true, contentType: "text/plain" };
    }
    return failResult("Text file contains binary or invalid characters");
  }

  return failResult("Allowed reference formats: pdf, docx, png, jpeg, txt");
}

export function validateBuilderDeliverableFile(buffer: Buffer, originalName: string): FileValidationResult {
  const MAX_SIZE = 200 * 1024 * 1024; // 200 MB
  if (buffer.length > MAX_SIZE) {
    return { valid: false, contentType: "", error: "File exceeds 200 MB limit" };
  }
  if (buffer.length < 4) {
    return { valid: false, contentType: "", error: "File is empty or corrupt" };
  }

  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  if (BANNED_EXTENSIONS.has(ext)) {
    return { valid: false, contentType: "", error: "Executable or unsafe file extension is prohibited" };
  }

  if (isExecutableSignature(buffer)) {
    return { valid: false, contentType: "", error: "Executable binary signatures are strictly prohibited" };
  }

  if (ext === "zip") {
    if (detectProjectFileSignature(buffer) === "zip") {
      return { valid: true, contentType: "application/zip" };
    }
    return { valid: false, contentType: "", error: "ZIP archive signature verification failed" };
  }

  if (ext === "pdf") {
    if (detectProjectFileSignature(buffer) === "pdf") {
      return { valid: true, contentType: "application/pdf" };
    }
    return { valid: false, contentType: "", error: "PDF magic byte signature verification failed" };
  }

  if (ext === "docx") {
    if (detectProjectFileSignature(buffer) === "zip") {
      return {
        valid: true,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }
    return { valid: false, contentType: "", error: "DOCX archive signature verification failed" };
  }

  if (ext === "pptx") {
    if (detectProjectFileSignature(buffer) === "zip") {
      return {
        valid: true,
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      };
    }
    return { valid: false, contentType: "", error: "PPTX archive signature verification failed" };
  }

  if (ext === "png") {
    if (detectImageSignature(buffer) === "png") {
      return { valid: true, contentType: "image/png" };
    }
    return { valid: false, contentType: "", error: "PNG magic byte signature verification failed" };
  }

  if (ext === "jpeg" || ext === "jpg") {
    if (detectImageSignature(buffer) === "jpeg") {
      return { valid: true, contentType: "image/jpeg" };
    }
    return { valid: false, contentType: "", error: "JPEG magic byte signature verification failed" };
  }

  if (ext === "txt") {
    if (detectProjectFileSignature(buffer) === "text") {
      const sample = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf8").toLowerCase();
      if (sample.includes("<html") || sample.includes("<script") || sample.includes("<!doctype")) {
        return { valid: false, contentType: "", error: "HTML or script content disguised as text is forbidden" };
      }
      return { valid: true, contentType: "text/plain" };
    }
    return { valid: false, contentType: "", error: "Text file contains binary or invalid characters" };
  }

  return { valid: false, contentType: "", error: "Allowed deliverable formats: zip, pdf, docx, pptx, png, jpeg, txt" };
}
