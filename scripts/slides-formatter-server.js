const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const HOST = "127.0.0.1";

function extractPresentationId(input) {
  const value = String(input || "").trim();
  const patterns = [
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function buildAppsScriptFormatter(presentationId) {
  return `function autoFormatTextbookDeck() {
  const presentation = SlidesApp.openById("${presentationId}");
  const slides = presentation.getSlides();
  const colors = {
    ink: "#172033",
    accent: "#0E7490",
    softAccent: "#ECFEFF",
    border: "#BAE6FD",
    white: "#FFFFFF"
  };

  slides.forEach((slide, slideIndex) => {
    presentation.toast("Formatting slide " + (slideIndex + 1) + " of " + slides.length, "Textbook Formatter", 4);
    slide.getBackground().setSolidFill(colors.white);

    slide.getPageElements().forEach((element) => {
      if (element.getPageElementType() !== SlidesApp.PageElementType.SHAPE) return;

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

  if (isFirstSlideTitle || top < 80 || (text.length < 90 && height < 90)) return "title";
  if (text.length < 120 && !/[.!?]\\s/.test(text)) return "heading";
  return "body";
}`;
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function pageHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Slides Textbook Formatter</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #e2e8f0; color: #0f172a; }
    main { width: min(480px, 100%); min-height: 100vh; margin: 0 auto; background: #f8fafc; }
    header { padding: 18px; background: #fff; border-bottom: 1px solid #e2e8f0; }
    h1 { margin: 3px 0 0; font-size: 24px; }
    .eyebrow { margin: 0; color: #0e7490; font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
    section { padding: 18px; }
    .panel { background: #ecfeff; border: 1px solid #bae6fd; border-radius: 18px; padding: 16px; }
    label { display: block; font-weight: 900; margin-bottom: 8px; }
    textarea { width: 100%; min-height: 112px; border: 1px solid #67e8f9; border-radius: 12px; padding: 14px; font-weight: 700; resize: vertical; }
    button, a.button { width: 100%; border: 0; border-radius: 12px; padding: 14px; margin-top: 12px; background: #0f172a; color: #fff; font-weight: 900; text-align: center; text-decoration: none; display: block; cursor: pointer; }
    button.secondary { background: #0e7490; }
    .card { margin-top: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; }
    .row { display: flex; gap: 10px; align-items: center; padding: 10px; background: #f1f5f9; border-radius: 12px; margin-top: 8px; font-size: 14px; font-weight: 700; }
    .num { flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; background: #0e7490; color: white; display: grid; place-items: center; font-size: 12px; font-weight: 900; }
    pre { white-space: pre-wrap; word-break: break-word; max-height: 320px; overflow: auto; background: #020617; color: #ecfeff; padding: 12px; border-radius: 12px; font-size: 11px; line-height: 1.45; }
    .hidden { display: none; }
    .error { color: #be123c; background: #fff1f2; border-color: #fecdd3; }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">Slides Tool</p>
      <h1>Textbook Auto Format</h1>
    </header>
    <section>
      <div class="panel">
        <label for="link">Google Slides link paste karo</label>
        <textarea id="link" placeholder="https://docs.google.com/presentation/d/..."></textarea>
        <button id="submit">Submit and Start Process</button>
      </div>

      <div id="status" class="card hidden">
        <p class="eyebrow">Live Status</p>
        <h2 id="statusTitle">Processing started</h2>
        <div id="rows"></div>
      </div>

      <div id="result" class="card hidden"></div>
    </section>
  </main>
  <script>
    const link = document.getElementById("link");
    const submit = document.getElementById("submit");
    const statusBox = document.getElementById("status");
    const rows = document.getElementById("rows");
    const result = document.getElementById("result");

    function setRows(items) {
      rows.innerHTML = "";
      items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = '<span class="num">' + (index + 1) + '</span><span>' + item + '</span>';
        rows.appendChild(row);
      });
    }

    submit.addEventListener("click", async () => {
      statusBox.classList.remove("hidden");
      result.classList.add("hidden");
      setRows(["Reading link", "Extracting presentation ID", "Starting formatter"]);
      submit.disabled = true;
      submit.textContent = "Processing...";

      try {
        setTimeout(() => setRows(["Reading link", "Extracting presentation ID", "Generating formatter script"]), 350);
        const response = await fetch("/api/slides/format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link: link.value })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Formatting failed");

        setRows(data.slideStatuses || ["Formatter ready"]);
        result.classList.remove("hidden");
        result.className = "card";
        result.innerHTML =
          '<p class="eyebrow">Ready</p>' +
          '<h2>Formatter generated</h2>' +
          '<a class="button" target="_blank" href="' + data.editUrl + '">Open Google Slides</a>' +
          '<button class="secondary" id="copy">Copy Apps Script</button>' +
          '<pre>' + data.automationScript.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])) + '</pre>';
        document.getElementById("copy").onclick = async () => {
          await navigator.clipboard.writeText(data.automationScript);
          document.getElementById("copy").textContent = "Copied";
        };
      } catch (error) {
        result.classList.remove("hidden");
        result.className = "card error";
        result.textContent = error.message;
      } finally {
        submit.disabled = false;
        submit.textContent = "Submit and Start Process";
      }
    });
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  if (url.pathname === "/" || url.pathname === "/slides-formatter" || url.pathname === "/slides-formatter/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(pageHtml());
    return;
  }

  if (url.pathname === "/api/slides/format" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const presentationId = extractPresentationId(payload.link);
        if (!presentationId) {
          sendJson(res, 400, { error: "Valid Google Slides link paste karo." });
          return;
        }

        sendJson(res, 200, {
          presentationId,
          applied: false,
          editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
          summary: [
            "Google Slides link accepted",
            "Formatter script generated",
            "Google Slides ke andar script run karte hi slide X of Y live dikhega",
          ],
          slideStatuses: [
            "Deck link detected",
            "Presentation ID extracted",
            "Formatter script ready",
            "Google Slides me run karne par slide-by-slide formatting dikhegi",
          ],
          automationScript: buildAppsScriptFormatter(presentationId),
        });
      } catch (error) {
        sendJson(res, 500, { error: error.message || "Formatter failed" });
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`Slides formatter running at http://${HOST}:${PORT}/slides-formatter/`);
});
