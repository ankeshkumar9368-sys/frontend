import { NextRequest, NextResponse } from "next/server";
import {
  applyGoogleSlidesFormat,
  buildAppsScriptFormatter,
  buildTextbookFormatRequests,
  buildTextbookSummary,
  buildSlideStatuses,
  extractPresentationId,
  getSlidesEditUrl,
  getManualFormatterSteps,
  loadGooglePresentation,
  SlidesFormatRequest,
} from "../../../../lib/slidesFormatter";

const GOOGLE_SLIDES_ACCESS_TOKEN =
  process.env.GOOGLE_SLIDES_ACCESS_TOKEN ||
  process.env.GOOGLE_ACCESS_TOKEN ||
  "";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SlidesFormatRequest;
    const presentationId = extractPresentationId(body.link || "");

    if (!presentationId) {
      return NextResponse.json(
        { error: "Paste a valid Google Slides link." },
        { status: 400 }
      );
    }

    if (!GOOGLE_SLIDES_ACCESS_TOKEN) {
      return NextResponse.json({
        presentationId,
        mode: body.mode || "apply",
        applied: false,
        requestsCount: 1,
        summary: [
          "Google Slides link accepted",
          "Formatter script generated for this deck",
          "Run the script inside Google Slides to apply textbook formatting now",
          "Server API automation can be connected later with GOOGLE_SLIDES_ACCESS_TOKEN",
        ],
        editUrl: getSlidesEditUrl(presentationId),
        automationScript: buildAppsScriptFormatter(presentationId),
        setupSteps: getManualFormatterSteps(),
        slideStatuses: [
          "Deck link detected",
          "Formatter script generated",
          "Run script in Google Slides to see live slide-by-slide progress",
        ],
      });
    }

    const presentation = await loadGooglePresentation(
      presentationId,
      GOOGLE_SLIDES_ACCESS_TOKEN
    );
    const requests = buildTextbookFormatRequests(presentation);
    const mode = body.mode || "apply";

    if (mode === "apply" && requests.length > 0) {
      await applyGoogleSlidesFormat(
        presentationId,
        GOOGLE_SLIDES_ACCESS_TOKEN,
        requests
      );
    }

    return NextResponse.json({
      presentationId,
      presentationTitle: presentation.title,
      mode,
      applied: mode === "apply",
      requestsCount: requests.length,
      summary: buildTextbookSummary(presentation, requests.length),
      editUrl: getSlidesEditUrl(presentationId),
      automationScript: buildAppsScriptFormatter(presentationId),
      setupSteps: getManualFormatterSteps(),
      slideStatuses: buildSlideStatuses(presentation),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Slides formatting failed." },
      { status: 500 }
    );
  }
}
