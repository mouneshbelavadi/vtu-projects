import "server-only";
import type { Project, ProjectFile, ProjectMedia } from "@/types/database";

export interface ProjectReadiness {
  canPublish: boolean;
  criteria: {
    hasThreeScreenshots: boolean;
    screenshotsCount: number;
    hasCodeFile: boolean;
    hasSetupGuide: boolean;
    hasVivaQuestions: boolean;
    hasPriceAboveZero: boolean;
    hasLongDescription: boolean;
    descriptionLength: number;
  };
  recommendations: {
    hasReportTemplate: boolean;
    hasPptTemplate: boolean;
  };
  missingRequired: string[];
  missingRecommended: string[];
}

export function evaluateProjectReadiness(
  project: Project,
  files: ProjectFile[],
  media: ProjectMedia[]
): ProjectReadiness {
  const screenshotsCount = media.filter((m) => Boolean(m.alt_text?.trim())).length;
  const hasThreeScreenshots = screenshotsCount >= 3;

  const fileKinds = new Set(files.map((f) => f.kind));
  const hasCodeFile = fileKinds.has("code");
  const hasSetupGuide = fileKinds.has("setup_guide");
  const hasVivaQuestions = fileKinds.has("viva_qa");

  const hasPriceAboveZero = project.price_inr > 0;
  const descriptionLength = project.description ? project.description.trim().length : 0;
  const hasLongDescription = descriptionLength >= 300;

  const hasReportTemplate = fileKinds.has("report");
  const hasPptTemplate = fileKinds.has("ppt");

  const missingRequired: string[] = [];
  if (!hasThreeScreenshots) {
    missingRequired.push(
      `At least 3 screenshots with alt text required (currently ${screenshotsCount})`
    );
  }
  if (!hasCodeFile) {
    missingRequired.push("Project source code file (.zip) is missing");
  }
  if (!hasSetupGuide) {
    missingRequired.push("Setup guide file (.pdf or .docx) is missing");
  }
  if (!hasVivaQuestions) {
    missingRequired.push("Viva questions file (.pdf or .docx) is missing");
  }
  if (!hasPriceAboveZero) {
    missingRequired.push("Price must be greater than zero");
  }
  if (!hasLongDescription) {
    missingRequired.push(
      `Description must be at least 300 characters (currently ${descriptionLength})`
    );
  }

  const missingRecommended: string[] = [];
  if (!hasReportTemplate) {
    missingRecommended.push("Report template file is recommended for complete learning pack");
  }
  if (!hasPptTemplate) {
    missingRecommended.push("Presentation template file (.pptx) is recommended");
  }

  const canPublish = missingRequired.length === 0;

  return {
    canPublish,
    criteria: {
      hasThreeScreenshots,
      screenshotsCount,
      hasCodeFile,
      hasSetupGuide,
      hasVivaQuestions,
      hasPriceAboveZero,
      hasLongDescription,
      descriptionLength,
    },
    recommendations: {
      hasReportTemplate,
      hasPptTemplate,
    },
    missingRequired,
    missingRecommended,
  };
}
