import { NextResponse } from "next/server";
import * as fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as Y from "yjs";

export async function GET(request) {
  try {
    const documentsRoot = path.join(process.cwd(), "documents");
    await fs.promises.mkdir(documentsRoot, { recursive: true }); // Ensure root directory exists

    const documentIdFromQuery = request.nextUrl.searchParams.get("id");

    // If a specific document ID is requested, load its latest state
    if (documentIdFromQuery) {
      const docPath = path.join(documentsRoot, documentIdFromQuery.toString());
      const latestBinaryFilePath = path.join(docPath, "latest.bin");

      if (fs.existsSync(latestBinaryFilePath)) {
        const binaryState = await fs.promises.readFile(latestBinaryFilePath);
        return NextResponse.json(
          { id: documentIdFromQuery, state: binaryState.toString("base64") },
          { status: 200 },
        );
      } else {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }
    }

    // Otherwise, list all documents
    const documentFolders = await fs.promises.readdir(documentsRoot, {
      withFileTypes: true,
    });
    const documentList = [];
    const filterTitle = request.nextUrl.searchParams
      .get("title")
      ?.toLowerCase();

    for (const dirent of documentFolders) {
      if (dirent.isDirectory()) {
        const docId = dirent.name;
        const docPath = path.join(documentsRoot, docId);
        const latestBinaryFilePath = path.join(docPath, "latest.bin");

        if (fs.existsSync(latestBinaryFilePath)) {
          const binaryState = await fs.promises.readFile(latestBinaryFilePath);

          const ydoc = new Y.Doc();
          let title = null;
          let saved_at = null;
          let saved_by = null;
          let content = null;

          try {
            Y.applyUpdate(ydoc, binaryState);
            const metadata = ydoc.getMap("metadata");
            title = metadata.get("title");
            saved_at = metadata.get("saved_at");
            saved_by = metadata.get("saved_by");
            content = ydoc.getText("quill").toString(); // Get the document content
          } catch (updateError) {
            console.warn(
              `Warning: Could not fully reconstruct YDoc for document ${docId} when listing. Metadata might be incomplete. Error:`,
              updateError.message,
            );
            // If YDoc reconstruction fails, we still add the document with fallback info
          }

          console.log(title);
          console.log(saved_at);
          console.log(saved_by);

          const contentLower = content.toLowerCase();

          // Apply filter if title or content contains the filterTitle
          if (
            filterTitle &&
            !(
              title.toLowerCase().includes(filterTitle) ||
              contentLower.includes(filterTitle)
            )
          ) {
            continue;
          }

          console.log(title);
          console.log(saved_at);
          console.log(saved_by);

          documentList.push({
            id: docId,
            title,
            saved_at,
            saved_by,
          });

          console.log(
            `Document ${docId} metadata loaded successfully for listing.`,
          );
        }
      }
    }

    // Sort documents by saved_at in descending order (newest first)
    documentList.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));

    return NextResponse.json(documentList, { status: 200 });
  } catch (error) {
    console.error("Error fetching document list:", error);
    return NextResponse.json(
      { error: "Failed to fetch document list" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { id, state, delta, markdownSummary, userName, documentTitle } = await request.json(); // Destructure new fields

    if (!state) {
      return NextResponse.json(
        { error: "Missing document state" },
        { status: 400 },
      );
    }

    // console.log(documentTitle);
    // console.log(userName);

    const binaryState = Buffer.from(state, "base64");
    const docIdToSave = id || uuidv4();
    const documentsDir = path.join(process.cwd(), "documents");
    const docPath = path.join(documentsDir, docIdToSave.toString()); // Directory for this document

    // Ensure document's directory exists (e.g., documents/documentId/)
    await fs.promises.mkdir(docPath, { recursive: true });

    // Ensure versions directory exists (e.g., documents/documentId/versions/)
    const versionsDir = path.join(docPath, "versions");
    await fs.promises.mkdir(versionsDir, { recursive: true });

    // Save the latest binary state
    const latestBinaryFilePath = path.join(docPath, "latest.bin"); // Renamed from documentId.bin
    await fs.promises.writeFile(latestBinaryFilePath, binaryState);

    // Create a timestamp for the new version
    const isoTimestamp = new Date().toISOString(); // Standard ISO 8601 format
    const versionFilename = isoTimestamp.replace(/[:.-]/g, "_"); // Filename-safe format

    // Save this specific version's binary state
    const versionBinaryFilePath = path.join(
      versionsDir,
      `${versionFilename}.bin`,
    );
    await fs.promises.writeFile(versionBinaryFilePath, binaryState);

    let finalTitle = documentTitle || "Untitled Document";
    if (!documentTitle) {
      console.warn(`Warning: documentTitle not provided for document ${docIdToSave}. Using default "Untitled Document".`);
    }

    let finalAuthor = userName || "Unknown";
    if (!userName) {
      console.warn(`Warning: userName not provided for document ${docIdToSave}. Using default "Unknown".`);
    }

    const versionMetadata = {
      timestamp: isoTimestamp, // Store the standard ISO string
      author: finalAuthor,
      title: finalTitle,
      summary_markdown: markdownSummary || "", // Store the provided markdown summary
      delta: delta || {}, // Store the provided Delta JSON
    };

    const versionMetadataFilePath = path.join(
      versionsDir,
      `${versionFilename}.json`,
    );
    await fs.promises.writeFile(
      versionMetadataFilePath,
      JSON.stringify(versionMetadata, null, 2),
    );

    console.log(`Saving document ${docIdToSave} with:`);
    console.log(`  Title: ${finalTitle}`);
    console.log(`  Author: ${finalAuthor}`);
    console.log(`  Timestamp: ${isoTimestamp}`);
    console.log(`Document ${docIdToSave} saved successfully.`);
    console.log(`New version ${isoTimestamp} created.`);

    return NextResponse.json({ id: docIdToSave }, { status: 200 });
  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const documentsRoot = path.join(process.cwd(), "documents");
    const documentId = request.nextUrl.searchParams.get("id");

    if (!documentId) {
      console.error("DELETE request failed: Missing document ID.");
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    const docPath = path.join(documentsRoot, documentId.toString());

    // Check if the document directory exists before attempting to delete
    if (!fs.existsSync(docPath)) {
      console.warn(
        `DELETE request: Document directory for ID ${documentId} not found at ${docPath}.`,
      );
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Delete the entire document directory recursively
    await fs.promises.rm(docPath, { recursive: true, force: true });
    console.log(`Document directory ${docPath} deleted successfully.`);
    return NextResponse.json(
      {
        message: `Document ${documentId} and its versions deleted successfully`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Error deleting document: ${error.message}`);
    return NextResponse.json(
      { error: `Failed to delete document: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function GET_VERSIONS(request) {
  try {
    const documentsRoot = path.join(process.cwd(), "documents");
    const documentId = request.nextUrl.searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    const versionsDir = path.join(
      documentsRoot,
      documentId.toString(),
      "versions",
    );

    if (!fs.existsSync(versionsDir)) {
      return NextResponse.json([], { status: 200 }); // No versions yet
    }

    const versionFiles = await fs.promises.readdir(versionsDir);
    const versionList = [];

    for (const file of versionFiles) {
      if (file.endsWith(".json")) {
        const filePath = path.join(versionsDir, file);
        try {
          const content = await fs.promises.readFile(filePath, "utf-8");
          const metadata = JSON.parse(content);
          versionList.push(metadata);
        } catch (error) {
          console.error(`Error reading version metadata file ${file}:`, error);
        }
      }
    }

    // Sort versions by timestamp (newest first)
    versionList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json(versionList, { status: 200 });
  } catch (error) {
    console.error("Error fetching document versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch document versions" },
      { status: 500 },
    );
  }
}

export async function GET_VERSION_CONTENT(request) {
  try {
    const documentsRoot = path.join(process.cwd(), "documents");
    const documentId = request.nextUrl.searchParams.get("id");
    const versionTimestamp = request.nextUrl.searchParams.get("timestamp");
    const format = request.nextUrl.searchParams.get("format"); // 'binary', 'delta', 'markdown'

    if (!documentId || !versionTimestamp || !format) {
      return NextResponse.json(
        { error: "Document ID, version timestamp, and format are required" },
        { status: 400 },
      );
    }

    const versionsDir = path.join(
      documentsRoot,
      documentId.toString(),
      "versions",
    );

    if (!fs.existsSync(versionsDir)) {
      return NextResponse.json(
        { error: "Document or versions not found" },
        { status: 404 },
      );
    }

    const versionMetadataFilePath = path.join(
      versionsDir,
      `${versionTimestamp}.json`,
    );

    if (!fs.existsSync(versionMetadataFilePath)) {
      return NextResponse.json(
        { error: "Version metadata not found" },
        { status: 404 },
      );
    }

    const metadataContent = await fs.promises.readFile(
      versionMetadataFilePath,
      "utf-8",
    );
    const versionMetadata = JSON.parse(metadataContent);

    switch (format) {
      case "binary": {
        const versionBinaryFilePath = path.join(
          versionsDir,
          `${versionTimestamp}.bin`,
        );
        if (!fs.existsSync(versionBinaryFilePath)) {
          return NextResponse.json(
            { error: "Version binary state not found" },
            { status: 404 },
          );
        }
        const binaryState = await fs.promises.readFile(versionBinaryFilePath);
        return NextResponse.json(
          {
            id: documentId,
            timestamp: versionTimestamp,
            state: binaryState.toString("base64"),
          },
          { status: 200 },
        );
      }
      case "delta": {
        if (!versionMetadata.delta) {
          return NextResponse.json(
            { error: "Delta content not available for this version" },
            { status: 404 },
          );
        }
        return NextResponse.json(
          {
            id: documentId,
            timestamp: versionTimestamp,
            delta: versionMetadata.delta,
          },
          { status: 200 },
        );
      }
      case "markdown": {
        if (!versionMetadata.summary_markdown) {
          return NextResponse.json(
            { error: "Markdown content not available for this version" },
            { status: 404 },
          );
        }
        return new NextResponse(versionMetadata.summary_markdown, {
          status: 200,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
          },
        });
      }
      default:
        return NextResponse.json(
          {
            error:
              "Invalid format requested. Must be 'binary', 'delta', or 'markdown'.",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error fetching specific document version content:", error);
    return NextResponse.json(
      { error: "Failed to fetch specific document version content" },
      { status: 500 },
    );
  }
}
