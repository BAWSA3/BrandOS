import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export type UploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
};

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: 'image' | 'raw' | 'auto';
    publicId?: string;
    transformation?: Record<string, unknown>[];
  } = {}
): Promise<UploadResult> {
  const { folder = 'brandos', resourceType = 'auto', publicId, transformation } = options;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: publicId,
          transformation,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      )
      .end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
