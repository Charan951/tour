import React, { useState } from 'react';
import { Upload, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import toast from 'react-hot-toast';

interface CloudinaryImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  currentUrl?: string;
}

export const CloudinaryImageUploader: React.FC<CloudinaryImageUploaderProps> = ({
  onUploadSuccess,
  label = 'Upload Image to Cloudinary',
  currentUrl
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WEBP, etc.)');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiClient.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success && res.data.url) {
        const uploadedUrl = res.data.url;
        setPreviewUrl(uploadedUrl);
        onUploadSuccess(uploadedUrl);
        toast.success('Image successfully uploaded to Cloudinary!');
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Cloudinary Upload Error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image to Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-300">{label}</label>
      
      <div className="flex items-center gap-3">
        <label className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-[#57D0C9] flex items-center gap-2 cursor-pointer transition-all shadow-md">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#57D0C9]" />
              <span>Uploading to Cloudinary...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Choose Image File</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {previewUrl && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="line-clamp-1 max-w-[200px]">{previewUrl}</span>
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="relative h-28 w-48 rounded-xl overflow-hidden border border-slate-700 mt-2 shadow-md">
          <img src={previewUrl} alt="Cloudinary preview" className="w-full h-full object-cover" />
          <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded">
            Cloudinary Live
          </span>
        </div>
      )}
    </div>
  );
};
