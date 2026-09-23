'use client';

import { useState, useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { useCreateStory } from '@/lib/react-query/queriesAndMutations';
import { useToast } from '@/components/ui/use-toast';
import { X, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryCreatorProps {
  onClose: () => void;
  onStoryCreated?: () => void;
}

export default function StoryCreator({ onClose, onStoryCreated }: StoryCreatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const { toast } = useToast();
  
  const { mutateAsync: createStory, isPending: isUploading } = useCreateStory();

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setFileType(selectedFile.type.startsWith('video/') ? 'video' : 'image');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false
  });

  const handleShare = async () => {
    if (!file) return;
    
    try {
      await createStory({
        file: file,
        caption: caption.trim() ? caption : undefined
      });
      
      toast({ title: 'Story created successfully' });
      onStoryCreated?.();
      onClose();
    } catch (error) {
      toast({ 
        title: 'Error creating story',
        description: 'Please try again later',
        variant: 'destructive'
      });
    }
  };

  const resetFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl('');
    setFileType(null);
    setCaption('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-dark-2 rounded-xl max-w-md w-full flex flex-col overflow-hidden max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-dark-4">
            <h2 className="text-light-1 h3-bold">Create Story</h2>
            <button 
              onClick={onClose}
              disabled={isUploading}
              className="text-light-1 hover:text-light-3 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {!file ? (
              <>
                <div 
                  {...getRootProps()} 
                  className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition ${
                    isDragActive ? 'border-primary-500 bg-primary-500/10' : 'border-dark-4 hover:bg-dark-3'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Plus className="w-12 h-12 text-light-3 mb-4" />
                  <p className="text-light-1 base-medium text-center mb-2">Tap to upload photo or video</p>
                  <p className="text-light-4 small-regular text-center">SVG, PNG, JPG or Video (max. 20MB)</p>
                </div>
                {fileRejections.length > 0 && (
                  <p className="text-red mt-4 text-center small-regular">File is too large or not supported.</p>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative w-full h-[400px] bg-dark-1 rounded-xl overflow-hidden flex items-center justify-center">
                  {fileType === 'video' ? (
                    <video 
                      src={previewUrl} 
                      className="w-full h-full object-contain"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption... (optional)"
                    className="shad-textarea w-full p-4 resize-none"
                    maxLength={500}
                    disabled={isUploading}
                  />
                  <div className="flex justify-end text-light-4 small-regular">
                    {caption.length}/500
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {file && (
            <div className="p-4 border-t border-dark-4 flex gap-4">
              <button 
                onClick={resetFile}
                disabled={isUploading}
                className="flex-1 bg-dark-4 hover:bg-dark-3 text-light-1 py-3 rounded-lg font-medium transition"
              >
                Change
              </button>
              <button 
                onClick={handleShare}
                disabled={isUploading}
                className="flex-1 bg-primary-500 hover:bg-primary-500/90 text-light-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
                Share Story
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
