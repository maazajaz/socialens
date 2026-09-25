"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUserContext } from "@/context/SupabaseAuthContext";
import {
  useLikeReel,
  useUnlikeReel,
  useSaveReel,
  useUnsaveReel,
  useViewReel,
  useGetReelComments,
  useCreateReelComment,
  useDeleteReel,
} from "@/lib/react-query/queriesAndMutations";
import { multiFormatDateString } from "@/lib/utils";

type ReelViewerProps = {
  reels: any[];
  initialIndex?: number;
  onClose?: () => void;
  isModal?: boolean;
};

const ReelViewer = ({ reels, initialIndex = 0, onClose, isModal = true }: ReelViewerProps) => {
  const { user } = useUserContext();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true); // Must be true for browser autoplay to work
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [doubleTapLike, setDoubleTapLike] = useState(false);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTapTime = useRef(0);

  const currentReel = reels[currentIndex];

  const { mutate: likeReelMutation } = useLikeReel();
  const { mutate: unlikeReelMutation } = useUnlikeReel();
  const { mutate: saveReelMutation } = useSaveReel();
  const { mutate: unsaveReelMutation } = useUnsaveReel();
  const { mutate: viewReelMutation } = useViewReel();
  const { mutate: deleteReelMutation } = useDeleteReel();
  const { data: comments } = useGetReelComments(currentReel?.id || "");
  const { mutate: createComment, isPending: isCommenting } = useCreateReelComment();

  const handleDeleteReel = () => {
    if (window.confirm("Are you sure you want to delete this reel?")) {
      deleteReelMutation(currentReel.id);
      if (onClose) onClose();
      else window.location.href = "/reels"; // Fallback redirect
    }
  };

  // Track view when reel becomes active
  useEffect(() => {
    if (currentReel?.id) {
      viewReelMutation(currentReel.id);
    }
  }, [currentReel?.id]);

  // Handle video playback
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.currentTime = 0;
      if (isPlaying) {
        video.play().catch(() => {});
      }
    }

    // Pause other videos
    videoRefs.current.forEach((v, i) => {
      if (v && i !== currentIndex) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying]);

  // Progress bar
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowComments(false);
    }
  }, [currentIndex, reels.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowComments(false);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          goToNext();
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          goToPrev();
          break;
        case "m":
          setIsMuted((prev) => !prev);
          break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "Escape":
          onClose?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Touch/Scroll handling for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;

    if (Math.abs(deltaY) > 50 || velocity > 0.3) {
      if (deltaY > 0) goToNext();
      else goToPrev();
    }
  };

  // Wheel scroll for desktop
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (showComments) return;
      if (e.deltaY > 30) goToNext();
      else if (e.deltaY < -30) goToPrev();
    },
    [goToNext, goToPrev, showComments]
  );

  const togglePlay = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  // Double-tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      if (!currentReel.isLiked) {
        likeReelMutation(currentReel.id);
        currentReel.isLiked = true;
        currentReel._count = {
          ...currentReel._count,
          likes: (currentReel._count?.likes || 0) + 1,
        };
      }
      setDoubleTapLike(true);
      setTimeout(() => setDoubleTapLike(false), 1000);
    } else {
      togglePlay();
    }
    lastTapTime.current = now;
  };

  const handleLike = () => {
    if (currentReel.isLiked) {
      unlikeReelMutation(currentReel.id);
      currentReel.isLiked = false;
      currentReel._count = {
        ...currentReel._count,
        likes: Math.max(0, (currentReel._count?.likes || 0) - 1),
      };
    } else {
      likeReelMutation(currentReel.id);
      currentReel.isLiked = true;
      currentReel._count = {
        ...currentReel._count,
        likes: (currentReel._count?.likes || 0) + 1,
      };
    }
  };

  const handleSave = () => {
    if (currentReel.isSaved) {
      unsaveReelMutation(currentReel.id);
      currentReel.isSaved = false;
    } else {
      saveReelMutation(currentReel.id);
      currentReel.isSaved = true;
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    createComment({
      reelId: currentReel.id,
      content: commentText.trim(),
    });
    setCommentText("");
  };

  const handleShare = async () => {
    const reelUrl = `${window.location.origin}/reels?id=${currentReel.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reel by ${currentReel.creator?.name}`,
          text: currentReel.caption || "Check out this reel!",
          url: reelUrl,
        });
      } catch (e) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(reelUrl);
    }
  };

  if (!currentReel) return null;

  return (
    <div
      ref={containerRef}
      className={isModal ? "reel-viewer-modal" : "reel-viewer-inline"}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="reel-progress-bar">
        <div
          className="reel-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Close button */}
      {isModal && onClose && (
        <button onClick={onClose} className="reel-close-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {/* Video */}
      <div className="reel-video-wrapper" onClick={handleDoubleTap}>
        <video
          ref={(el) => { videoRefs.current[currentIndex] = el; }}
          src={currentReel.video_url}
          className="reel-video"
          loop
          playsInline
          muted={isMuted}
          autoPlay
        />

        {/* Pause indicator */}
        {!isPlaying && (
          <div className="reel-pause-indicator">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        )}

        {/* Double tap heart animation */}
        {doubleTapLike && (
          <div className="reel-double-tap-heart">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="#ff3040">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        )}
      </div>

      {/* Right side action buttons (Instagram style) */}
      <div className="reel-actions">
        {/* Like */}
        <button
          className="reel-action-btn"
          onClick={handleLike}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill={currentReel.isLiked ? "#ff3040" : "none"}
            stroke={currentReel.isLiked ? "#ff3040" : "white"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="reel-action-count">
            {currentReel._count?.likes || 0}
          </span>
        </button>

        {/* Comment */}
        <button
          className="reel-action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="reel-action-count">
            {currentReel._count?.comments || 0}
          </span>
        </button>

        {/* Share */}
        <button className="reel-action-btn" onClick={handleShare}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>

        {/* Save */}
        <button className="reel-action-btn" onClick={handleSave}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill={currentReel.isSaved ? "white" : "none"}
            stroke="white"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Delete (Owner only) */}
        {user?.id === currentReel.creator_id && (
          <button className="reel-action-btn" onClick={handleDeleteReel}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3040" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}

        {/* Mute/Unmute */}
        <button
          className="reel-action-btn"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>

        {/* Creator avatar */}
        <Link href={`/profile/${currentReel.creator?.id}`}>
          <img
            src={currentReel.creator?.image_url || "/assets/icons/profile-placeholder.svg"}
            alt={currentReel.creator?.name}
            className="w-10 h-10 rounded-full border-2 border-white object-cover mt-2"
          />
        </Link>
      </div>

      {/* Bottom info overlay */}
      <div className="reel-info">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${currentReel.creator?.id}`} className="flex items-center gap-2">
            <img
              src={currentReel.creator?.image_url || "/assets/icons/profile-placeholder.svg"}
              alt={currentReel.creator?.name}
              className="w-9 h-9 rounded-full border border-white/30 object-cover"
            />
            <span className="font-semibold text-white text-sm">
              {currentReel.creator?.username || currentReel.creator?.name}
            </span>
          </Link>
          <span className="text-white/60 text-xs">
            {multiFormatDateString(currentReel.created_at)}
          </span>
        </div>

        {currentReel.caption && (
          <p className="text-white text-sm mb-2 line-clamp-2">
            {currentReel.caption}
          </p>
        )}

        {currentReel.audio_name && (
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span>{currentReel.audio_name}</span>
          </div>
        )}

        {currentReel.tags && currentReel.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {currentReel.tags.map((tag: string, i: number) => (
              <span key={i} className="text-primary-500 text-xs">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation hints */}
      {currentIndex > 0 && (
        <button onClick={goToPrev} className="reel-nav-up">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
      {currentIndex < reels.length - 1 && (
        <button onClick={goToNext} className="reel-nav-down">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* View count */}
      <div className="reel-view-count">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>{currentReel.view_count || 0}</span>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div className="reel-comments-panel">
          <div className="flex items-center justify-between p-4 border-b border-dark-4">
            <h3 className="text-white font-semibold">Comments</h3>
            <button onClick={() => setShowComments(false)} className="text-white/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="reel-comments-list">
            {comments && comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 p-3">
                  <img
                    src={comment.user?.image_url || "/assets/icons/profile-placeholder.svg"}
                    alt={comment.user?.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">
                        {comment.user?.username}
                      </span>
                      <span className="text-white/40 text-xs">
                        {multiFormatDateString(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mt-0.5">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <p className="text-sm">No comments yet</p>
                <p className="text-xs mt-1">Be the first to comment!</p>
              </div>
            )}
          </div>

          <form onSubmit={handleComment} className="reel-comment-input">
            <img
              src={user?.image_url || "/assets/icons/profile-placeholder.svg"}
              alt="you"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isCommenting}
              className="text-primary-500 font-semibold text-sm disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReelViewer;
