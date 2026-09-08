import fs from 'node:fs/promises';
import path from 'node:path';

const contentTypes = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

export async function GET(request, context) {
  const { filename } = await context.params;
  const safeFilename = path.basename(filename || '');
  if (!safeFilename || safeFilename !== filename) {
    return new Response('Archivo no válido', { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'storage', 'uploads', 'permisos', safeFilename);
  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(safeFilename).toLowerCase();
    return new Response(file, {
      headers: {
        'Content-Type': contentTypes[extension] || 'application/octet-stream',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    return new Response('Archivo no encontrado', { status: 404 });
  }
}
