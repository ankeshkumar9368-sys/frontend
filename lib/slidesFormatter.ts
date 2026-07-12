export type SlidesFormatMode = "preview" | "apply";

export type SlidesFormatRequest = {
  link: string;
  mode?: SlidesFormatMode;
};

export type SlidesFormatResult = {
  presentationId: string;
  presentationTitle?: string;
  mode: SlidesFormatMode;
  applied: boolean;
  requestsCount: number;
  summary: string[];
  editUrl: string;
  automationScript?: string;
  setupSteps?: string[];
  slideStatuses?: string[];
};

type GooglePresentation = {
  presentationId: string;
  title?: string;
  slides?: GoogleSlide[];
};

type GoogleSlide = {
  objectId: string;
  pageElements?: GooglePageElement[];
};

type GooglePageElement = {
  objectId: string;
  size?: { width?: { magnitude?: number }; height?: { magnitude?: number } };
  transform?: { translateY?: number };
  shape?: {
    shapeType?: string;
    text?: { textElements?: Array<{ textRun?: { content?: string } }> };
  };
};

type SlidesBatchRequest = Record<string, unknown>;

const SLIDES_ID_PATTERNS = [
  /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/,
  /^([a-zA-Z0-9_-]{20,})$/,
];

const textbookPalette = {
  ink: { red: 0.09, green: 0.12, blue: 0.18 },
  muted: { red: 0.39, green: 0.45, blue: 0.55 },
  accent: { red: 0.04, green: 0.46, blue: 0.62 },
  softAccent: { red: 0.9, green: 0.98, blue: 1 },
  white: { red: 1, green: 1, blue: 1 },
};

export function extractPresentationId(input: string): string | null {
  const value = input.trim();
  for (const pattern of SLIDES_ID_PATTERNS) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function getSlidesEditUrl(presentationId: string) {
  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

export function buildAppsScriptFormatter(presentationId: string) {
  return `function autoFormatTextbookDeck() {
  const presentation = SlidesApp.openById("${presentationId}");
  const slides = presentation.getSlides();
  const colors = {
    ink: "#172033",
    muted: "#64748B",
    accent: "#0E7490",
    softAccent: "#ECFEFF",
    border: "#BAE6FD",
    white: "#FFFFFF"
  };

  slides.forEach((slide, slideIndex) => {
    presentation.toast("Formatting slide " + (slideIndex + 1) + " of " + slides.length, "Textbook Formatter", 4);
    slide.getBackground().setSolidFill(colors.white);
    const pageElements = slide.getPageElements();

    pageElements.forEach((element) => {
      const elementType = element.getPageElementType();
      if (elementType !== SlidesApp.PageElementType.SHAPE) return;

      const shape = element.asShape();
      const textRange = shape.getText();
      const rawText = textRange.asString().trim();
      if (!rawText) return;

      const role = classifyTextbookRole_(element, rawText, slideIndex);
      const textStyle = textRange.getTextStyle();
      const paragraphStyle = textRange.getParagraphStyle();

      shape.getFill().setSolidFill(role === "title" ? colors.softAccent : colors.white);
      shape.getBorder().setWeight(role === "title" ? 1.25 : 0.4);
      shape.getBorder().getLineFill().setSolidFill(role === "title" ? colors.accent : colors.border);

      textStyle.setFontFamily("Arial");
      textStyle.setForegroundColor(role === "body" ? colors.ink : colors.accent);
      textStyle.setBold(role !== "body");
      textStyle.setFontSize(role === "title" ? 28 : role === "heading" ? 20 : 15);

      paragraphStyle.setParagraphAlignment(SlidesApp.ParagraphAlignment.START);
      paragraphStyle.setLineSpacing(role === "body" ? 115 : 100);
      paragraphStyle.setSpaceAbove(role === "body" ? 6 : 2);
      paragraphStyle.setSpaceBelow(role === "body" ? 6 : 4);
    });

    presentation.toast("Slide " + (slideIndex + 1) + " formatted", "Textbook Formatter", 2);
  });

  presentation.toast("All " + slides.length + " slides formatted successfully", "Textbook Formatter", 6);
}

function classifyTextbookRole_(element, text, slideIndex) {
  const top = element.getTop();
  const height = element.getHeight();
  const isFirstSlideTitle = slideIndex === 0 && top < 140;

  if (isFirstSlideTitle || top < 80 || (text.length < 90 && height < 90)) {
    return "title";
  }

  if (text.length < 120 && !/[.!?]\\s/.test(text)) {
    return "heading";
  }

  return "body";
}`;
}

export function getManualFormatterSteps() {
  return [
    "Open the Google Slides deck",
    "Go to Extensions > Apps Script",
    "Paste the generated script and press Run",
    "Approve the Google permission prompt once",
    "Return to Slides and review the formatted deck",
  ];
}

export function buildTextbookFormatRequests(presentation: GooglePresentation): SlidesBatchRequest[] {
  const requests: SlidesBatchRequest[] = [];

  for (const slide of presentation.slides || []) {
    requests.push({
      updatePageProperties: {
        objectId: slide.objectId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: { color: { rgbColor: textbookPalette.white } },
          },
        },
        fields: "pageBackgroundFill.solidFill.color",
      },
    });

    for (const element of slide.pageElements || []) {
      if (!element.shape?.text?.textElements?.length) continue;

      const role = classifyTextElement(element);
      requests.push({
        updateShapeProperties: {
          objectId: element.objectId,
          shapeProperties: {
            shapeBackgroundFill: {
              solidFill: { color: { rgbColor: role === "title" ? textbookPalette.softAccent : textbookPalette.white } },
            },
            outline: {
              outlineFill: { solidFill: { color: { rgbColor: role === "title" ? textbookPalette.accent : textbookPalette.white } } },
              weight: { magnitude: role === "title" ? 1.2 : 0.3, unit: "PT" },
            },
          },
          fields: "shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color,outline.weight",
        },
      });

      requests.push({
        updateTextStyle: {
          objectId: element.objectId,
          textRange: { type: "ALL" },
          style: {
            fontFamily: "Arial",
            fontSize: { magnitude: role === "title" ? 28 : role === "heading" ? 20 : 15, unit: "PT" },
            foregroundColor: {
              opaqueColor: { rgbColor: role === "body" ? textbookPalette.ink : textbookPalette.accent },
            },
            bold: role !== "body",
          },
          fields: "fontFamily,fontSize,foregroundColor,bold",
        },
      });

      requests.push({
        updateParagraphStyle: {
          objectId: element.objectId,
          textRange: { type: "ALL" },
          style: {
            lineSpacing: role === "body" ? 115 : 100,
            alignment: "START",
            spaceAbove: { magnitude: role === "body" ? 6 : 2, unit: "PT" },
            spaceBelow: { magnitude: role === "body" ? 6 : 4, unit: "PT" },
          },
          fields: "lineSpacing,alignment,spaceAbove,spaceBelow",
        },
      });
    }
  }

  return requests;
}

export function buildTextbookSummary(presentation: GooglePresentation, requestsCount: number) {
  const slides = presentation.slides?.length || 0;
  const textBoxes = presentation.slides?.reduce((count, slide) => {
    return count + (slide.pageElements || []).filter((element) => element.shape?.text?.textElements?.length).length;
  }, 0) || 0;

  return [
    `${slides} slide${slides === 1 ? "" : "s"} scanned`,
    `${textBoxes} text box${textBoxes === 1 ? "" : "es"} prepared`,
    `${requestsCount} formatting change${requestsCount === 1 ? "" : "s"} generated`,
    "Applied textbook-style title, heading, body, spacing, background, and border rules",
  ];
}

export function buildSlideStatuses(presentation: GooglePresentation) {
  return (presentation.slides || []).map((slide, index) => {
    const textBoxes = (slide.pageElements || []).filter((element) => element.shape?.text?.textElements?.length).length;
    return `Slide ${index + 1}: ${textBoxes} text box${textBoxes === 1 ? "" : "es"} formatted`;
  });
}

export async function loadGooglePresentation(presentationId: string, accessToken: string): Promise<GooglePresentation> {
  const response = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Slides could not be opened. ${detail}`);
  }

  return response.json();
}

export async function applyGoogleSlidesFormat(
  presentationId: string,
  accessToken: string,
  requests: SlidesBatchRequest[]
) {
  const response = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Slides formatting failed. ${detail}`);
  }

  return response.json();
}

function classifyTextElement(element: GooglePageElement): "title" | "heading" | "body" {
  const text = (element.shape?.text?.textElements || [])
    .map((part) => part.textRun?.content || "")
    .join("")
    .trim();

  const top = element.transform?.translateY || 0;
  const height = element.size?.height?.magnitude || 0;

  if (top < 80 || (text.length < 90 && height < 90)) return "title";
  if (text.length < 120 && !/[.!?]\s/.test(text)) return "heading";
  return "body";
}
