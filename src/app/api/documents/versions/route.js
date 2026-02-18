import { promises as fs } from 'fs';
import path from 'path';

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
