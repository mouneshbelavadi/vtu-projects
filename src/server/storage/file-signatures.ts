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
