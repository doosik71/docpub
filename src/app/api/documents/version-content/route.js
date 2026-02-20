import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');
  const format = searchParams.get('format'); // 'binary', 'delta', 'markdown'

  if (!documentId || !timestamp || !format) {
    return new Response(JSON.stringify({ error: 'Document ID, timestamp, and format are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Convert the incoming ISO timestamp to the filename-safe format
  const filenameTimestamp = timestamp.replace(/[:.-]/g, "_");

  const versionsDir = path.join(process.cwd(), 'documents', documentId, 'versions');

  try {
    if (format === 'binary') {
      const binaryPath = path.join(versionsDir, `${filenameTimestamp}.bin`);
      const binaryContent = await fs.readFile(binaryPath);
      const responseBody = { state: binaryContent.toString('base64') };
      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (format === 'delta' || format === 'markdown') {
      const jsonPath = path.join(versionsDir, `${filenameTimestamp}.json`);
      const jsonContent = await fs.readFile(jsonPath, 'utf8');
      const metadata = JSON.parse(jsonContent);

      if (format === 'delta') {
        return new Response(JSON.stringify(metadata.delta), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else { // format === 'markdown'
        return new Response(metadata.summary_markdown || '', {
          status: 200,
          headers: { 'Content-Type': 'text/markdown' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid format specified. Must be binary, delta, or markdown.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error(`Error retrieving version content for document ${documentId}, timestamp ${timestamp}, format ${format}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve version content.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
