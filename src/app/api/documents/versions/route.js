import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('id');

  if (!documentId) {
    return new Response(JSON.stringify({ error: 'Document ID is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const documentDir = path.join(process.cwd(), 'documents', documentId);
  const versionsDir = path.join(documentDir, 'versions');

  try {
    // Check if the versions directory exists
    await fs.access(versionsDir);
  } catch (error) {
    // If directory doesn't exist, return empty array as there are no versions yet
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const files = await fs.readdir(versionsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const versions = await Promise.all(jsonFiles.map(async (file) => {
      const filePath = path.join(versionsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    }));

    // Sort by timestamp, newest first (assuming timestamp is part of the JSON metadata)
    versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return new Response(JSON.stringify(versions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error listing versions for document ${documentId}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve versions.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    const timestamp = searchParams.get('timestamp');

    if (!documentId || !timestamp) {
      return NextResponse.json(
        { error: 'Document ID and timestamp are required.' },
        { status: 400 }
      );
    }

    const documentDir = path.join(process.cwd(), 'documents', documentId);
    const versionsDir = path.join(documentDir, 'versions');

    // Convert the incoming ISO timestamp to the filename-safe format
    const filenameTimestamp = timestamp.replace(/[:.-]/g, '_');

    const versionBinaryFilePath = path.join(versionsDir, `${filenameTimestamp}.bin`);
    const versionMetadataFilePath = path.join(versionsDir, `${filenameTimestamp}.json`);

    let filesDeleted = [];

    // Delete binary file
    try {
      await fs.access(versionBinaryFilePath); // Check if file exists
      await fs.unlink(versionBinaryFilePath);
      filesDeleted.push(`${filenameTimestamp}.bin`);
    } catch (error) {
      if (error.code !== 'ENOENT') { // Ignore if file does not exist
        console.error(`Error deleting binary file ${versionBinaryFilePath}:`, error);
        return NextResponse.json(
          { error: `Failed to delete binary file: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Delete metadata file
    try {
      await fs.access(versionMetadataFilePath); // Check if file exists
      await fs.unlink(versionMetadataFilePath);
      filesDeleted.push(`${filenameTimestamp}.json`);
    } catch (error) {
      if (error.code !== 'ENOENT') { // Ignore if file does not exist
        console.error(`Error deleting metadata file ${versionMetadataFilePath}:`, error);
        return NextResponse.json(
          { error: `Failed to delete metadata file: ${error.message}` },
          { status: 500 }
        );
      }
    }

    if (filesDeleted.length === 0) {
      return NextResponse.json(
        { message: 'No files found for the specified version to delete.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Version ${timestamp} for document ${documentId} deleted successfully.`, filesDeleted },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting document version: ${error.message}`);
    return NextResponse.json(
      { error: `Failed to delete document version: ${error.message}` },
      { status: 500 }
    );
  }
}

