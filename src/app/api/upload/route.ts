import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
];
const ALLOWED_FONT_TYPES = [
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  'application/x-font-woff', 'application/x-font-ttf', 'application/vnd.ms-opentype',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assetType = (formData.get('type') as string) || 'image';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const allowedTypes = assetType === 'font' ? ALLOWED_FONT_TYPES : ALLOWED_IMAGE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadToCloudinary(buffer, {
      folder: `brandos/${assetType}`,
      resourceType: assetType === 'font' ? 'raw' : 'image',
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      originalName: file.name,
      size: file.size,
      type: file.type,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const assetType = (formData.get('type') as string) || 'image';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        results.push({ success: false, originalName: file.name, error: 'File too large' });
        continue;
      }

      const allowedTypes = assetType === 'font' ? ALLOWED_FONT_TYPES : ALLOWED_IMAGE_TYPES;
      if (!allowedTypes.includes(file.type)) {
        results.push({ success: false, originalName: file.name, error: 'Invalid file type' });
        continue;
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await uploadToCloudinary(buffer, {
          folder: `brandos/${assetType}`,
          resourceType: assetType === 'font' ? 'raw' : 'image',
        });

        results.push({
          success: true,
          url: result.url,
          publicId: result.publicId,
          originalName: file.name,
          size: file.size,
          type: file.type,
        });
      } catch {
        results.push({ success: false, originalName: file.name, error: 'Failed to upload' });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      uploaded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
