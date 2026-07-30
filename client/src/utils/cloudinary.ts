/**
 * Cloudinary URL Transformation & Optimization Utility matching optimisation.md Section 4.1
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:good' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  crop?: 'fill' | 'limit' | 'fit' | 'thumb';
}

export const getOptimizedCloudinaryUrl = (
  url: string | undefined | null,
  options: ImageTransformOptions = {}
): string => {
  if (!url) return '';
  if (typeof url !== 'string') return '';

  // Return non-Cloudinary images as-is (e.g. Unsplash, local assets)
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const {
    width = 800,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  // Build Cloudinary transformation parameters string
  const transforms = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (crop) transforms.push(`c_${crop}`);

  const transformString = transforms.join(',');

  // Inject transformation into Cloudinary URL after /upload/
  return url.replace('/upload/', `/upload/${transformString}/`);
};
