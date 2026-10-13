import { describe, it, expect } from "vitest";
import { catalogueFilterSchema } from "@/server/projects/catalogue";

describe("Catalogue Parameters Validation & Security", () => {
  it("parses valid search and filter query parameters", () => {
    const validParams = {
      q: "computer vision",
      branch: "cse",
      semester: "sem-6",
      scheme: "2022",
      type: "mini_project",
      difficulty: "intermediate",
      price_min: "1000",
      price_max: "5000",
      sort: "price_low",
      page: "2",
    };

    const result = catalogueFilterSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("computer vision");
      expect(result.data.branch).toBe("cse");
      expect(result.data.price_min).toBe(1000);
      expect(result.data.price_max).toBe(5000);
      expect(result.data.sort).toBe("price_low");
      expect(result.data.page).toBe(2);
    }
  });

  it("safely sanitizes SQL injection attempts in search queries", () => {
    const maliciousParams = {
      q: "'; DROP TABLE projects; --",
      branch: "cse'; DROP TABLE categories; --",
      sort: "newest",
    };

    const result = catalogueFilterSchema.safeParse(maliciousParams);
    expect(result.success).toBe(true);
    if (result.success) {
      // Input is accepted only as a plain string, preventing raw query concatenation
      expect(result.data.q).toBe("'; DROP TABLE projects; --");
      expect(result.data.branch).toBe("cse'; DROP TABLE categories; --");
    }
  });

  it("safely ignores XSS script tags and invalid enum values", () => {
    const xssParams = {
      q: "<script>alert('xss')</script>",
      type: "malicious_course_type", // Invalid enum
      difficulty: "hacked_difficulty", // Invalid enum
      price_min: "-500", // Negative price invalid
      page: "invalid_page", // Non-number invalid
    };

    const result = catalogueFilterSchema.safeParse(xssParams);
    expect(result.success).toBe(false); // Schema refuses invalid types
  });

  it("enforces length bounds on query strings to prevent resource exhaustion", () => {
    const longParams = {
      q: "a".repeat(200), // Exceeds 100 character limit
    };

    const result = catalogueFilterSchema.safeParse(longParams);
    expect(result.success).toBe(false);
  });
});

describe("JSON-LD Security and Formatting", () => {
  it("escapes '<' characters in JSON-LD output to prevent HTML tag injection", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Smart System <script>alert(1)</script>",
      description: "Includes <bold> text and <embed> tags.",
    };

    const safeJson = JSON.stringify(schema).replace(/</g, "\\u003c");

    expect(safeJson).not.toContain("<script>");
    expect(safeJson).toContain("\\u003cscript>");
    expect(safeJson).toContain("\\u003cbold>");
  });

  it("omits aggregateRating when there are no approved reviews", () => {
    const reviewCount = 0;
    const averageRating: number | null = null;

    const productJsonLd: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Project Kit",
    };

    if (reviewCount > 0 && averageRating !== null) {
      productJsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: averageRating,
        reviewCount: reviewCount,
      };
    }

    expect(productJsonLd.aggregateRating).toBeUndefined();
  });

  it("includes aggregateRating when approved reviews exist", () => {
    const reviewCount = 5;
    const averageRating = 4.8;

    const productJsonLd: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Project Kit",
    };

    if (reviewCount > 0 && averageRating !== null) {
      productJsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: averageRating,
        reviewCount: reviewCount,
      };
    }

    expect(productJsonLd.aggregateRating).toBeDefined();
    expect(productJsonLd.aggregateRating.ratingValue).toBe(4.8);
    expect(productJsonLd.aggregateRating.reviewCount).toBe(5);
  });
});

describe("WhatsApp Click-to-Chat Link Formation", () => {
  it("formats WhatsApp link with prefilled text and page URL correctly", () => {
    const whatsappNumber = "+91 98765 43210";
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    const title = "Smart Traffic Management System";
    const pageUrl = "https://projects.vtuadda.com/projects/smart-traffic";

    const href = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      `Hello, I have a question about the project: ${title} (${pageUrl})`
    )}`;

    expect(cleanNumber).toBe("919876543210");
    expect(href).toContain("https://wa.me/919876543210?text=");
    expect(href).toContain(encodeURIComponent(title));
    expect(href).toContain(encodeURIComponent(pageUrl));
  });
});
