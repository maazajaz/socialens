"use client";

import { useState, useEffect } from "react";

type ShareProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
};

const ShareProfileModal = ({ isOpen, onClose, profile }: ShareProfileModalProps) => {
  const [copied, setCopied] = useState(false);

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${profile.id}`;
  const shareText = `Check out ${profile.name}'s profile (@${profile.username})!${profile.bio ? ' ' + profile.bio : ''}`;

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: "💬",
      color: "bg-green-500 hover:bg-green-600",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + profileUrl)}`
    },
    {
      name: "Twitter",
      icon: "🐦",
      color: "bg-blue-400 hover:bg-blue-500",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`
    },
    {
      name: "Facebook",
      icon: "📘",
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`
    },
    {
      name: "LinkedIn",
      icon: "💼",
      color: "bg-blue-700 hover:bg-blue-800",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`
    },
    {
      name: "Telegram",
      icon: "✈️",
      color: "bg-blue-500 hover:bg-blue-600",
      url: `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`
    }
  ];

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for iOS Safari and older browsers
        const tempInput = document.createElement('input');
        tempInput.value = profileUrl;
        document.body.appendChild(tempInput);
        tempInput.focus();
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShareClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-dark-2 rounded-lg p-6 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-light-1 text-lg font-semibold">Share Profile</h3>
          <button
            onClick={onClose}
            className="text-light-3 hover:text-light-1 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 p-3 bg-dark-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={profile.image_url || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-light-2 text-sm font-medium">{profile.name}</span>
          </div>
          <p className="text-light-3 text-sm line-clamp-2">{profile.bio}</p>
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleShareClick(option.url)}
              className={`${option.color} text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="text-sm font-medium">{option.name}</span>
            </button>
          ))}
        </div>

        {/* Copy Link */}
        <div className="border-t border-dark-4 pt-4">
          <div className="flex items-center gap-2 bg-dark-3 rounded-lg p-2">
            <input
              type="text"
              value={profileUrl}
              readOnly
              className="flex-1 bg-transparent text-light-2 text-sm outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareProfileModal;
