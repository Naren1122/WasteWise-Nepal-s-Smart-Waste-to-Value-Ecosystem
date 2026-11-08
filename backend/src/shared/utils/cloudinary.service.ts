import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
}

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadToCloudinary(
  fileDataUrlOrPath: string,
  folder: string = 'wastewise/complaints'
): Promise<CloudinaryUploadResult | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const res = await cloudinary.uploader.upload(fileDataUrlOrPath, {
      folder,
      resource_type: 'image',
    });

    return {
      secureUrl: res.secure_url,
      publicId: res.public_id,
      bytes: res.bytes,
      format: res.format,
    };
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error);
    return null;
  }
}
