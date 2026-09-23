"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Trash2, Volume2, VolumeX } from "lucide-react";
import { IStoryGroup } from "@/types";
import { viewStory, deleteStory } from "@/lib/supabase/api";

interface StoryViewerProps {
  storyGroups: IStoryGroup[];
  initialGroupIndex: number;
  currentUserId: string;
  onClose: () => void;
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};

export default function StoryViewer({
  storyGroups,
  initialGroupIndex,
  currentUserId,
  onClose,
}: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  
  // Track views
  useEffect(() => {
    if (currentStory && currentStory.creator_id !== currentUserId) {
      viewStory(currentStory.id).catch(console.error);
    }
  }, [currentStory, currentUserId]);

  // Handle ESC close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const goToNext = useCallback(() => {
    if (!currentGroup) return;
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroupIndex, currentStoryIndex, storyGroups.length, currentGroup, onClose]);

  const goToPrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
      setCurrentStoryIndex(storyGroups[currentGroupIndex - 1].stories.length - 1);
      setProgress(0);
    }
  }, [currentGroupIndex, currentStoryIndex, storyGroups]);

  // Timer for images
  useEffect(() => {
    if (!currentStory) return;
    
    // Clear existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    if (isPaused) return;

    if (currentStory.media_type === "image") {
      const duration = 5000;
      const step = 50; // update every 50ms
      
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (step / duration) * 100;
          if (next >= 100) {
            clearInterval(progressInterval.current!);
            goToNext();
            return 100;
          }
          return next;
        });
      }, step);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStory, isPaused, goToNext]);

  // Video play/pause based on isPaused
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPaused, currentStoryIndex]);

  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);

  const handleDelete = async () => {
    if (!currentStory || !window.confirm("Are you sure you want to delete this story?")) return;
    setIsPaused(true);
    try {
      await deleteStory(currentStory.id);
      // Move to next story after deletion
      goToNext();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPaused(false);
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden h-[100dvh]">
      <div 
        className="relative w-full h-full max-w-md mx-auto flex flex-col bg-dark-1 md:rounded-lg overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-4 bg-gradient-to-b from-black/60 to-transparent">
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} className="story-progress-bar flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="story-progress-fill h-full bg-white transition-all ease-linear"
                style={{ 
                  width: idx < currentStoryIndex ? "100%" : idx === currentStoryIndex ? `${progress}%` : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 text-white">
          <div className="flex items-center gap-3">
            <img 
              src={currentGroup.user.imageUrl || "/assets/icons/profile-placeholder.svg"} 
              alt={currentGroup.user.username} 
              className="w-7 h-7 rounded-full object-cover border border-white/20"
            />
            <div className="flex items-center gap-2 drop-shadow-md">
              <span className="font-semibold text-sm">{currentGroup.user.username}</span>
              <span className="text-white/70 text-sm">{getRelativeTime(currentStory.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {currentStory.creator_id === currentUserId && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                className="p-1 hover:bg-black/20 rounded-full transition-colors z-30"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
            {currentStory.media_type === "video" && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} 
                className="p-1 hover:bg-black/20 rounded-full transition-colors z-30"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="p-1 hover:bg-black/20 rounded-full transition-colors z-30"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {currentStory.media_type === "image" ? (
                <img 
                  src={currentStory.media_url} 
                  alt="story" 
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentStory.media_url}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-contain"
                  onTimeUpdate={(e) => {
                    if (isPaused) return;
                    const c = e.currentTarget.currentTime;
                    const d = e.currentTarget.duration;
                    if (d > 0) {
                      setProgress((c / d) * 100);
                    }
                  }}
                  onEnded={() => goToNext()}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
            <p className="text-white text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
              {currentStory.caption}
            </p>
          </div>
        )}
        
        {/* View Count (Own stories) */}
        {currentStory.creator_id === currentUserId && currentStory._count?.views !== undefined && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 text-white/90 text-sm bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
            <Eye className="w-4 h-4" />
            <span>{currentStory._count.views}</span>
          </div>
        )}

        {/* Navigation Overlays */}
        <div 
          className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }} 
        />
        <div 
          className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }} 
        />
      </div>
    </div>
  );
}
