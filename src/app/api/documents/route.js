import { NextResponse } from "next/server";
import * as fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as Y from "yjs"; // Import Y

export async function GET(request) {
  try {
    const documentsDir = path.join(process.cwd(), "documents");
    await fs.promises.mkdir(documentsDir, { recursive: true }); // Ensure directory exists

    const documentIdFromQuery = request.nextUrl.searchParams.get("id");
    if (documentIdFromQuery) {
      const filePath = path.join(documentsDir, `${documentIdFromQuery}.bin`);
      if (fs.existsSync(filePath)) {
        const binaryState = await fs.promises.readFile(filePath);
        return NextResponse.json({ id: documentIdFromQuery, state: binaryState.toString("base64") }, { status: 200 });
      } else {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
    }

    const files = await fs.promises.readdir(documentsDir);
    const documentList = [];
    const filterTitle = request.nextUrl.searchParams
      .get("title")
      ?.toLowerCase();

    console.log("Fetching document list...");
    console.log("Filter Title:", filterTitle);

    for (const file of files) {
      if (file.endsWith(".bin")) {
        const docId = file.replace(".bin", "");
        const filePath = path.join(documentsDir, file);
        const binaryState = await fs.promises.readFile(filePath);

        const ydoc = new Y.Doc();
        try {
          Y.applyUpdate(ydoc, binaryState);

          const metadata = ydoc.getMap("metadata");
          const title = metadata.get("title") || "Untitled Document";
          const saved_at = metadata.get("saved_at") || new Date().toISOString();
          const saved_by = metadata.get("saved_by") || "Unknown";

          const content = ydoc.getText('quill').toString(); // Get the document content
          const contentLower = content.toLowerCase();

          // Apply filter if title or content contains the filterTitle
          if (filterTitle && !(title.toLowerCase().includes(filterTitle) || contentLower.includes(filterTitle))) {
            continue;
          }

          documentList.push({
            id: docId,
            title,
            saved_at,
            saved_by,
          });

          console.log(`Document ${docId} metadata loaded successfully.`);
        } catch (updateError) {
          console.error(`Error loading metadata for ${docId}.bin:`, updateError);
          // Optionally add a placeholder for corrupted documents or skip
          documentList.push({
            id: docId,
            title: `Corrupted Document (${docId})`,
            saved_at: new Date().toISOString(),
            saved_by: "System",
            corrupted: true,
          });
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
    const { id, state } = await request.json(); // Destructure 'id' as well

    if (!state) {
      return NextResponse.json(
        { error: "Missing document state" },
        { status: 400 },
      );
    }

    const binaryState = Buffer.from(state, "base64");
    const docIdToSave = id || uuidv4(); // Use provided id or generate a new one
    const documentsDir = path.join(process.cwd(), "documents"); // Assuming 'documents' is at project root

    // Ensure the documents directory exists
    await fs.promises.mkdir(documentsDir, { recursive: true });

    const filePath = path.join(documentsDir, `${docIdToSave}.bin`);
    await fs.promises.writeFile(filePath, binaryState);

    console.log(`Document ${docIdToSave} saved successfully.`);
    return NextResponse.json({ id: docIdToSave }, { status: 200 });
  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 },
    );
  }
}
