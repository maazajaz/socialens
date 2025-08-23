"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export interface NotificationData {
  id: string;
  type: 'new_post' | 'like' | 'comment' | 'follow';
  title: string;
  message: string;
  avatar: string;
  actionUrl?: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

interface NotificationPopupProps {
  notification: NotificationData | null;
  onClose: () => void;
  onAction?: () => void;
}

const NotificationPopup = ({ notification, onClose, onAction }: NotificationPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setProgress(100);
      
      // Auto-hide with progress bar
      const duration = 6000; // 6 seconds
      const interval = 50; // Update every 50ms
      const step = (100 * interval) / duration;
      
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - step;
          if (newProgress <= 0) {
            clearInterval(progressTimer);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(progressTimer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    if (onAction) onAction();
    handleClose();
  };

  const getIcon = () => {
    switch (notification?.type) {
      case 'new_post':
        return "/assets/icons/posts.svg";
      case 'like':
        return "/assets/icons/liked.svg";
      case 'comment':
        return "/assets/icons/chat.svg";
      case 'follow':
        return "/assets/icons/people.svg";
      default:
        return "/assets/icons/bell.svg";
    }
  };

  const getTypeColor = () => {
    switch (notification?.type) {
      case 'new_post':
        return 'from-blue-500 to-blue-600';
      case 'like':
        return 'from-red-500 to-pink-600';
      case 'comment':
        return 'from-green-500 to-emerald-600';
      case 'follow':
        return 'from-purple-500 to-violet-600';
      default:
        return 'from-primary-500 to-primary-600';
    }
  };

  const getActionText = () => {
    switch (notification?.type) {
      case 'new_post':
        return "View Post";
      case 'like':
        return "View Post";
      case 'comment':
        return "Reply";
      case 'follow':
        return "View Profile";
      default:
        return "View";
    }
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 400, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            opacity: { duration: 0.2 }
          }}
          className="fixed top-6 right-6 z-50 max-w-sm w-full mx-4 sm:mx-0"
        >
          {/* Modern notification card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-dark-2/95 to-dark-3/95 backdrop-blur-lg border border-dark-4/50 rounded-2xl shadow-2xl">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 h-1 bg-dark-4 w-full">
              <motion.div 
                className={`h-full bg-gradient-to-r ${getTypeColor()}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>

            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getTypeColor()} opacity-5`} />

            <div className="relative p-5">
              {/* Header with close button */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Icon with gradient background */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${getTypeColor()} shadow-lg`}>
                    <img
                      src={getIcon()}
                      alt={notification.type}
                      width={18}
                      height={18}
                      className="filter brightness-0 invert"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-light-1 font-semibold text-sm leading-tight">
                      {notification.title}
                    </h4>
                    <p className="text-light-4 text-xs mt-0.5">
                      {notification.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="text-light-4 hover:text-light-1 transition-colors duration-200 p-1 hover:bg-dark-4/50 rounded-lg"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                  <img
                    src={notification.avatar || "/assets/icons/profile-placeholder.svg"}
                    alt={notification.userName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-dark-4/50"
                  />
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-2" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-light-2 text-sm leading-relaxed">
                    <span className="font-semibold text-light-1">{notification.userName}</span>
                    {' '}
                    <span>{notification.message}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              {notification.actionUrl && (
                <div className="flex gap-2">
                  <Link
                    href={notification.actionUrl}
                    onClick={handleAction}
                    className={`
                      flex-1 bg-gradient-to-r ${getTypeColor()} hover:shadow-lg 
                      text-white px-4 py-2.5 rounded-xl text-sm font-semibold 
                      transition-all duration-200 text-center hover:scale-[1.02] 
                      hover:shadow-colored/25
                    `}
                  >
                    {getActionText()}
                  </Link>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-dark-4/50 hover:bg-dark-3/50 text-light-2 hover:text-light-1 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                  >
                    Later
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopup;
