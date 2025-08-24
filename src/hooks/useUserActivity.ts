"use client";

import { useEffect, useRef } from 'react';
import { updateUserActivity, setUserInactive } from '@/lib/supabase/api';
import { useUserContext } from '@/context/SupabaseAuthContext';

export const useUserActivity = () => {
  const { isAuthenticated } = useUserContext();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity events
  const handleUserActivity = () => {
    if (!isAuthenticated) return;

    // Update user activity immediately
    updateUserActivity();

    // Clear existing inactivity timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Set new inactivity timeout (15 minutes - more realistic)
    inactivityTimeoutRef.current = setTimeout(() => {
      setUserInactive();
    }, 15 * 60 * 1000); // 15 minutes
  };

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up intervals if user is not authenticated
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return;
    }

    // Initial activity update when component mounts
    handleUserActivity();

    // Set up heartbeat interval (every 2 minutes for more accurate presence)
    heartbeatIntervalRef.current = setInterval(() => {
      updateUserActivity();
    }, 2 * 60 * 1000); // 2 minutes

    // Activity event listeners
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle activity updates to avoid excessive API calls
    let lastActivityUpdate = 0;
    const throttledActivityHandler = () => {
      const now = Date.now();
      if (now - lastActivityUpdate > 30000) { // Only update every 30 seconds
        lastActivityUpdate = now;
        handleUserActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledActivityHandler, true);
    });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
        // Set inactive after 2 minutes if page is hidden
        inactivityTimeoutRef.current = setTimeout(() => {
          setUserInactive();
        }, 2 * 60 * 1000); // 2 minutes
      } else {
        // User came back to the tab
        handleUserActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload
    const handleBeforeUnload = () => {
      setUserInactive();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      events.forEach(event => {
        document.removeEventListener(event, throttledActivityHandler, true);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Set user as inactive when component unmounts
      setUserInactive();
    };
  }, [isAuthenticated]);

  return null; // This hook doesn't render anything
};
