import { describe, it, expect } from "vitest";
import {
  detectImageSignature,
  detectProjectFileSignature,
} from "@/server/storage/file-signatures";
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
} from "@/lib/youtube";
import { evaluateProjectReadiness } from "@/server/projects/readiness";
import type { Project, ProjectFile, ProjectMedia } from "@/types/database";

describe("Admin Catalogue and File Verification", () => {
  describe("Image Magic Byte Signature Verification", () => {
    it("recognizes authentic PNG headers", () => {
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      expect(detectImageSignature(pngHeader)).toBe("png");
    });

    it("recognizes authentic JPEG headers", () => {
      const jpegHeader = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      expect(detectImageSignature(jpegHeader)).toBe("jpeg");
    });

    it("recognizes authentic WebP headers", () => {
      const webpHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // Size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      expect(detectImageSignature(webpHeader)).toBe("webp");
    });

    it("strictly refuses SVG, GIF, HTML, and disguised executables", () => {
      // SVG disguised as PNG
      const svgBuffer = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><circle/></svg>");
      expect(detectImageSignature(svgBuffer)).toBeNull();

      // GIF89a
      const gifBuffer = Buffer.from("GIF89a\x01\x00\x01\x00\x80\x00\x00");
      expect(detectImageSignature(gifBuffer)).toBeNull();

      // HTML payload
      const htmlBuffer = Buffer.from("<!DOCTYPE html><html><body>malicious</body></html>");
      expect(detectImageSignature(htmlBuffer)).toBeNull();

      // Windows PE executable (MZ)
      const exeBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff");
      expect(detectImageSignature(exeBuffer)).toBeNull();
    });
  });

  describe("Project Deliverable Magic Byte Verification", () => {
    it("recognizes PK signature for ZIP archives and OOXML documents", () => {
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      expect(detectProjectFileSignature(zipHeader)).toBe("zip");
    });

    it("recognizes %PDF signature for PDF documents", () => {
      const pdfHeader = Buffer.from("%PDF-1.7\n%embedded content");
      expect(detectProjectFileSignature(pdfHeader)).toBe("pdf");
    });

    it("detects valid plain UTF-8 text and markdown documents", () => {
      const textBuffer = Buffer.from("# Project Setup Guide\nRun `npm install`.");
      expect(detectProjectFileSignature(textBuffer)).toBe("text");
    });

    it("refuses disguised executables renamed to .zip or .pdf", () => {
      const fakeZipExe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff");
      expect(detectProjectFileSignature(fakeZipExe)).toBeNull();

      const fakePdfElf = Buffer.from("\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00");
      expect(detectProjectFileSignature(fakePdfElf)).toBeNull();
    });
  });

  describe("YouTube URL Parser and Embed Builder", () => {
    it("extracts 11-character video ID from standard youtube.com URLs", () => {
      const id = extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(id).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from shortened youtu.be URLs", () => {
      const id = extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ");
      expect(id).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from youtube.com/embed/ URLs", () => {
      const id = extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(id).toBe("dQw4w9WgXcQ");
    });

    it("builds privacy-preserving youtube-nocookie.com embed URL", () => {
      const embed = getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ");
      expect(embed).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("refuses non-YouTube domains and SSRF vectors", () => {
      expect(extractYouTubeVideoId("https://vimeo.com/12345678901")).toBeNull();
      expect(extractYouTubeVideoId("http://localhost:3000/admin")).toBeNull();
      expect(extractYouTubeVideoId("https://malicious-site.com/watch?v=dQw4w9WgXcQ")).toBeNull();
      expect(extractYouTubeVideoId("javascript:alert(1)")).toBeNull();
    });
  });

  describe("Go-Live Readiness Evaluation", () => {
    const baseProject: Project = {
      id: "11111111-1111-1111-1111-111111111111",
      slug: "smart-traffic-system",
      title: "Smart Traffic System using Computer Vision",
      summary: "Real-time traffic density estimation and adaptive signal controller.",
      description:
        "Comprehensive implementation of automated traffic light control using OpenCV and YOLOv8." +
        " This system captures live camera feeds, analyzes vehicle counts per lane, calculates dynamic green times," +
        " and provides fallback manual overrides for emergency vehicles. Tested across varied lighting conditions and VTU syllabus guidelines.",
      course_type: "mini_project",
      difficulty: "intermediate",
      tech_stack: ["Python", "OpenCV", "YOLOv8"],
      price_inr: 2499,
      sales_limit: 10,
      sales_window_start: "2026-10-13T00:00:00.000Z",
      status: "draft",
      cover_path: "projects/1111/cover.webp",
      demo_video_url: "https://youtu.be/dQw4w9WgXcQ",
      syllabus_note: "VTU 21CS62 prescribed",
      published_at: null,
      updated_at: "2026-10-13T00:00:00.000Z",
      created_at: "2026-10-13T00:00:00.000Z",
    };

    const validMedia: ProjectMedia[] = [
      {
        id: "m1",
        project_id: baseProject.id,
        storage_path: "m1.webp",
        alt_text: "Lane detection view",
        sort_order: 1,
        created_at: "2026-10-13T00:00:00.000Z",
      },
      {
        id: "m2",
        project_id: baseProject.id,
        storage_path: "m2.webp",
        alt_text: "Density estimation graph",
        sort_order: 2,
        created_at: "2026-10-13T00:00:00.000Z",
      },
      {
        id: "m3",
        project_id: baseProject.id,
        storage_path: "m3.webp",
        alt_text: "Adaptive signal controller hardware interface",
        sort_order: 3,
        created_at: "2026-10-13T00:00:00.000Z",
      },
    ];

    const validFiles: ProjectFile[] = [
      {
        id: "f1",
        project_id: baseProject.id,
        kind: "code",
        storage_path: "p/code.zip",
        original_name: "smart-traffic-code.zip",
        size_bytes: 1024 * 1024,
        content_type: "application/zip",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        version: 1,
        created_at: "2026-10-13T00:00:00.000Z",
      },
      {
        id: "f2",
        project_id: baseProject.id,
        kind: "setup_guide",
        storage_path: "p/setup.pdf",
        original_name: "setup-guide.pdf",
        size_bytes: 512 * 1024,
        content_type: "application/pdf",
        sha256: null,
        version: 1,
        created_at: "2026-10-13T00:00:00.000Z",
      },
      {
        id: "f3",
        project_id: baseProject.id,
        kind: "viva_qa",
        storage_path: "p/viva.pdf",
        original_name: "viva-qa.pdf",
        size_bytes: 256 * 1024,
        content_type: "application/pdf",
        sha256: null,
        version: 1,
        created_at: "2026-10-13T00:00:00.000Z",
      },
    ];

    it("approves publication when all 6 mandatory criteria are met", () => {
      const readiness = evaluateProjectReadiness(baseProject, validFiles, validMedia);
      expect(readiness.canPublish).toBe(true);
      expect(readiness.missingRequired).toHaveLength(0);
      expect(readiness.criteria.hasThreeScreenshots).toBe(true);
      expect(readiness.criteria.hasCodeFile).toBe(true);
      expect(readiness.criteria.hasSetupGuide).toBe(true);
      expect(readiness.criteria.hasVivaQuestions).toBe(true);
      expect(readiness.criteria.hasPriceAboveZero).toBe(true);
      expect(readiness.criteria.hasLongDescription).toBe(true);
    });

    it("refuses publication when fewer than 3 screenshots are present", () => {
      const readiness = evaluateProjectReadiness(baseProject, validFiles, validMedia.slice(0, 2));
      expect(readiness.canPublish).toBe(false);
      expect(readiness.missingRequired.some((r) => r.includes("At least 3 screenshots"))).toBe(true);
    });

    it("refuses publication when source code file is missing", () => {
      const nonCodeFiles = validFiles.filter((f) => f.kind !== "code");
      const readiness = evaluateProjectReadiness(baseProject, nonCodeFiles, validMedia);
      expect(readiness.canPublish).toBe(false);
      expect(readiness.missingRequired.some((r) => r.includes("code file"))).toBe(true);
    });

    it("refuses publication when setup guide or viva Q&A is missing", () => {
      const filesWithoutViva = validFiles.filter((f) => f.kind !== "viva_qa");
      const readiness = evaluateProjectReadiness(baseProject, filesWithoutViva, validMedia);
      expect(readiness.canPublish).toBe(false);
      expect(readiness.missingRequired.some((r) => r.includes("Viva questions"))).toBe(true);
    });

    it("refuses publication when price is zero", () => {
      const zeroPriceProj = { ...baseProject, price_inr: 0 };
      const readiness = evaluateProjectReadiness(zeroPriceProj, validFiles, validMedia);
      expect(readiness.canPublish).toBe(false);
      expect(readiness.missingRequired.some((r) => r.includes("Price must be greater than zero"))).toBe(true);
    });

    it("refuses publication when description is under 300 characters", () => {
      const shortDescProj = { ...baseProject, description: "Short description under 300 chars." };
      const readiness = evaluateProjectReadiness(shortDescProj, validFiles, validMedia);
      expect(readiness.canPublish).toBe(false);
      expect(readiness.missingRequired.some((r) => r.includes("at least 300 characters"))).toBe(true);
    });

    it("flags recommendations without blocking publication", () => {
      const readiness = evaluateProjectReadiness(baseProject, validFiles, validMedia);
      expect(readiness.canPublish).toBe(true);
      expect(readiness.recommendations.hasReportTemplate).toBe(false);
      expect(readiness.recommendations.hasPptTemplate).toBe(false);
      expect(readiness.missingRecommended).toHaveLength(2);
    });
  });
});
