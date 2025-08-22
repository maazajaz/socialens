"use client";

import { useEffect } from "react";
import Link from "next/link";

type AuthPromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  action: string; // e.g., "like posts", "comment", "save posts"
};

const AuthPromptModal = ({ isOpen, onClose, action }: AuthPromptModalProps) => {
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
      <div className="bg-dark-2 rounded-lg p-6 w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-light-1 text-lg font-semibold">Sign in required</h3>
          <button
            onClick={onClose}
            className="text-light-3 hover:text-light-1 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Message */}
        <div className="mb-6 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-light-2 mb-2">
            You need to be signed in to {action}.
          </p>
          <p className="text-light-3 text-sm">
            Join SociaLens to interact with posts and connect with others!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/sign-in"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors text-center block font-medium"
            onClick={onClose}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="w-full bg-dark-4 hover:bg-dark-3 text-light-1 py-2 px-4 rounded-lg transition-colors text-center block font-medium"
            onClick={onClose}
          >
            Create Account
          </Link>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-3 text-light-3 hover:text-light-1 text-sm py-2 transition-colors"
        >
          Continue browsing without account
        </button>
      </div>
    </div>
  );
};

export default AuthPromptModal;
