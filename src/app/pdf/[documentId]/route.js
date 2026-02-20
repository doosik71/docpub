import { NextResponse } from "next/server";
import * as Y from "yjs";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import katex from "katex";

const documentsPath = path.join(process.cwd(), "documents");
const printCssPath = path.join(process.cwd(), "src/app/pdf/print.css");
const printCss = fs.readFileSync(printCssPath, "utf-8");

async function loadYDoc(documentId) {
  const filePath = path.join(documentsPath, `${documentId}.bin`);
  const ydoc = new Y.Doc();

  if (fs.existsSync(filePath)) {
    const encodedState = fs.readFileSync(filePath);
    try {
      Y.applyUpdate(ydoc, encodedState);
    } catch (updateError) {
      console.error(
        `[PDF Export] Error applying Y.Doc update for ${documentId}.bin:`,
        updateError,
      );
      return null; // Indicate corrupted or unreadable document
    }
  } else {
    console.log(`[PDF Export] Document not found: ${documentId}.bin`);
    return null; // Indicate document not found
  }
  return ydoc;
}

function convertYDocToHtml(ydoc) {
  // Get the Quill-compatible Delta directly from Y.Text
  const delta = ydoc.getText("quill").toDelta();

  // Initialize QuillDeltaToHtmlConverter with the Delta
  const converter = new QuillDeltaToHtmlConverter(delta, {
    // Custom render for formula blot
    customCssClasses: (op) => {
      // Add custom classes if needed for styling
      if (op.attributes && op.attributes.formula) {
        return "ql-formula"; // Add a class to formula blocks
      }
      return null;
    },
    customTag: (op) => {
      // Custom tags if needed
      return null;
    },
    customAttributor: (op, attr) => {
      // Custom attributes if needed
      return null;
    },
    formula: (op) => {
      // This is the key for rendering formulas
      const formula = op.insert.formula;
      if (formula) {
        try {
          // Render KaTeX directly here. Needs KaTeX CSS to look good in the final PDF.
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: true,
          });
        } catch (e) {
          console.error(
            "KaTeX rendering error during Delta to HTML conversion:",
            e,
          );
          return `<code>${formula}</code>`; // Fallback to code if error
        }
      }
      return op.insert.formula || "";
    },
  });

  const html = converter.convert();
  return html;
}

export async function GET(request, { params }) {
  const { documentId } = params;

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is required" },
      { status: 400 },
    );
  }

  const ydoc = await loadYDoc(documentId);

  if (!ydoc) {
    return NextResponse.json(
      { error: "Document not found or corrupted" },
      { status: 404 },
    );
  }

  const htmlContent = convertYDocToHtml(ydoc);

  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set consistent viewport and media features for reliable rendering
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
    ]);
    await page.setViewport({ width: 1920, height: 1080 });

    // Listen for console messages and page errors for debugging
    page.on("console", (msg) => console.log("[Puppeteer Console]", msg.text()));
    page.on("pageerror", (err) =>
      console.error("[Puppeteer Page Error]", err.toString()),
    );

    // Set the HTML content directly
    await page.emulateMediaType("print"); // Explicitly set media type to print
    await page.setContent(
      `
      <!DOCTYPE html>
      <html lang="ko-KR">
      <head>
        <title>${documentId}</title>
        <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css" rel="stylesheet">
        <style>
          ${printCss}
        </style>
      </head>
      <body>
        <div class="ql-editor">
          <h1>Document Content</h1>
          ${htmlContent}
        </div>
      </body>
      </html>
    `,
      {
        waitUntil: "networkidle0",
      },
    );

    // Wait for KaTeX CSS and fonts to be loaded and applied
    await page.waitForFunction(
      'document.querySelector("link[href*=\\"katex.min.css\\"]") && document.fonts.ready',
    );

    // Add a short delay to allow for rendering to complete
    await new Promise((resolve) => setTimeout(resolve, 500)); // Give it 500ms more for rendering to settle

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1in",
        right: "1in",
        bottom: "1in",
        left: "1in",
      },
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${documentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
