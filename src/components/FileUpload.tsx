
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  bucket: string;
  path?: string;
  accept?: { [key: string]: string[] };
  maxFiles?: number;
  maxSize?: number;
  onUploadComplete?: (urls: string[]) => void;
  existingFiles?: string[];
}

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  path = '',
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    'application/pdf': ['.pdf'],
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadComplete,
  existingFiles = [],
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      uploading: false,
      uploaded: false,
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [...existingFiles];

    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        if (fileData.uploaded) continue;

        // Update progress
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploading: true, progress: 0 } : f
        ));

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}-${fileData.file.name}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileData.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);

        // Update file status
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploading: false, uploaded: true, progress: 100, url: publicUrl } : f
        ));
      }

      onUploadComplete?.(uploadedUrls);
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500 mt-2">
              Maximum {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Selected Files:</h4>
          {files.map((fileData, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              {getFileIcon(fileData.file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {fileData.uploading && (
                  <Progress value={fileData.progress} className="mt-1" />
                )}
              </div>
              {fileData.uploaded && (
                <span className="text-green-600 text-sm font-medium">✓ Uploaded</span>
              )}
              {!fileData.uploaded && !uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && !files.every(f => f.uploaded) && (
        <Button 
          onClick={uploadFiles} 
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Upload ${files.filter(f => !f.uploaded).length} file(s)`}
        </Button>
      )}
    </div>
  );
};
