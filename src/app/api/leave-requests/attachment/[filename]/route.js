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
  const requestedPath = String(filename || '').replace(/\\/g, '/');
  const safeSegments = requestedPath.split('/').filter(Boolean);

  if (!safeSegments.length || safeSegments.some((segment) => segment === '.' || segment === '..')) {
    return new Response('Archivo no válido', { status: 400 });
  }

  const rootDir = path.resolve(process.cwd(), 'storage', 'uploads', 'permisos');
  const filePath = path.resolve(rootDir, ...safeSegments);

  if (filePath !== rootDir && !filePath.startsWith(rootDir + path.sep)) {
    return new Response('Archivo no válido', { status: 400 });
  }

  let resolvedFilePath = filePath;
  try {
    await fs.access(filePath);
  } catch {
    const legacyFilePath = path.resolve(rootDir, safeSegments[safeSegments.length - 1]);
    try {
      await fs.access(legacyFilePath);
      resolvedFilePath = legacyFilePath;
    } catch {
      return new Response('Archivo no encontrado', { status: 404 });
    }
  }

  try {
    const file = await fs.readFile(resolvedFilePath);
    const extension = path.extname(filePath).toLowerCase();
    const download = request.nextUrl.searchParams.get('download') === '1';

    return new Response(file, {
      headers: {
        'Content-Type': contentTypes[extension] || 'application/octet-stream',
        'Content-Disposition': download ? `attachment; filename="${path.basename(resolvedFilePath)}"` : 'inline',
      },
    });
  } catch {
    return new Response('Archivo no encontrado', { status: 404 });
  }
}
