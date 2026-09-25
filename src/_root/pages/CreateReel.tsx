"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCreateReel } from "@/lib/react-query/queriesAndMutations";
import { Button } from "@/components/ui/button";
import { useDropzone, FileWithPath } from "react-dropzone";
import { useToast } from "@/components/ui/use-toast";

const CreateReel = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { mutateAsync: createReel, isPending: isCreating } = useCreateReel();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [audioName, setAudioName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setErrorMessage("");

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB

        if (file.size > MAX_SIZE) {
          setErrorMessage(
            `Video size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 50MB.`
          );
          return;
        }

        // Check duration (max 90 seconds like Instagram)
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          if (video.duration > 90) {
            setErrorMessage("Video must be 90 seconds or shorter.");
            return;
          }
          setVideoFile(file);
          setVideoPreview(URL.createObjectURL(file));
        };
        video.src = URL.createObjectURL(file);
      }
    },
    []
  );

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      const error = rejectedFiles[0]?.errors?.[0];
      if (error?.code === "file-too-large") {
        setErrorMessage("Video size exceeds 50MB limit.");
      } else if (error?.code === "file-invalid-type") {
        setErrorMessage("Invalid file type. Please upload MP4, MOV, or WebM video.");
      } else {
        setErrorMessage("Could not upload this file. Please try again.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "video/*": [".mp4", ".webm"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      setErrorMessage("Please upload a video for your reel.");
      return;
    }

    try {
      await createReel({
        file: [videoFile],
        caption: caption || undefined,
        tags: tags || undefined,
        audioName: audioName || undefined,
      });

      toast({
        title: "Reel created! 🎬",
        description: "Your reel has been published successfully.",
      });

      router.push("/reels");
    } catch (error: any) {
      toast({
        title: "Error creating reel",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview("");
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <img
            src="/assets/icons/reels.svg"
            width={36}
            height={36}
            alt="reels"
            className="invert-white"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Create Reel</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7 w-full max-w-3xl">
          {/* Video Upload */}
          <div className="flex flex-col gap-2">
            <label className="shad-form_label">Video *</label>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden bg-dark-3">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full max-h-[500px] object-contain"
                  controls
                  playsInline
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-3 right-3 bg-dark-1/80 hover:bg-dark-1 text-white p-2 rounded-full transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-center text-light-4 text-sm py-2">
                  Click the × to remove and choose a different video
                </p>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`flex-center flex-col bg-dark-3 rounded-xl cursor-pointer p-8 border-2 border-dashed transition-colors ${
                  isDragActive ? "border-primary-500 bg-dark-4" : "border-dark-4"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-dark-4 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-light-4">
                      <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
                      <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="2"/>
                      <polygon points="10,12 10,19 16,15.5" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="base-medium text-light-2 mb-1">
                      {isDragActive ? "Drop your video here" : "Drag video here"}
                    </h3>
                    <p className="text-light-4 small-regular">
                      MP4, MOV, WebM (Max 50MB, up to 90 seconds)
                    </p>
                  </div>
                  <Button type="button" className="shad-button_dark_4">
                    Select from device
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="flex flex-col gap-2">
            <label className="shad-form_label">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your reel..."
              className="shad-textarea"
              maxLength={2200}
            />
            <p className="text-light-4 text-xs text-right">{caption.length}/2200</p>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label className="shad-form_label">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="dance, comedy, trending (separated by commas)"
              className="shad-input"
            />
          </div>

          {/* Audio Name */}
          <div className="flex flex-col gap-2">
            <label className="shad-form_label">Audio / Song Name</label>
            <input
              type="text"
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
              placeholder="Original audio, song name..."
              className="shad-input"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 items-center justify-end">
            <Button
              type="button"
              className="shad-button_dark_4"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="shad-button_primary whitespace-nowrap"
              disabled={isCreating || !videoFile}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                "Publish Reel"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReel;
