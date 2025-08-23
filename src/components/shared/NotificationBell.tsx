
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserContext } from "@/context/SupabaseAuthContext";
// @ts-ignore
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  user_id: string;
  from_user_id: string;
  from_user_name: string;
  from_user_avatar?: string;
  avatar?: string;
  action_url?: string;
  read?: boolean;
  created_at: string;
};

const NotificationBell = () => {
  const { user } = useUserContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    // Subscribe to new notifications for the current user
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async () => {
          // Fetch latest notifications in real time
          const res = await supabase
            .from('notifications')
            .select('*, user:users!notifications_from_user_id_fkey(id, name, username, image_url)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          const data = res.data as (Notification & { user?: { id: string; name: string; username: string; image_url?: string } })[] | null;
          setNotifications(data || []);
          setUnreadCount((data || []).filter((n: Notification) => !n.read).length);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Fetch initial notifications with debug log
  useEffect(() => {
    if (!user?.id) return;
      supabase
        .from('notifications')
        .select('*, user:users!notifications_from_user_id_fkey(id, name, username, image_url)') // Join users table on from_user_id
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then((res) => {
          console.log('Notification debug (join):', res.data); // Debug log for join query
          const data = res.data as (Notification & { user?: { id: string; name: string; username: string; image_url?: string } })[] | null;
          setNotifications(data || []);
          setUnreadCount((data || []).filter((n: Notification) => !n.read).length);
        });
  }, [user?.id]);

  const handleBellClick = async () => {
    const newDropdownState = !showDropdown;
    setShowDropdown(newDropdownState);
    if (newDropdownState && user?.id) {
      // Fetch latest notifications when opening dropdown
      const res = await supabase
        .from('notifications')
        .select('*, user:users!notifications_from_user_id_fkey(id, name, username, image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const data = res.data as (Notification & { user?: { id: string; name: string; username: string; image_url?: string } })[] | null;
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n: Notification) => !n.read).length);
    }
    // Mark all as read in the database
    if (user?.id && notifications.length > 0) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds)
          .eq('user_id', user.id);
      }
    }
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      {/* Modern Bell Button */}
      <motion.button 
        className="relative p-3 rounded-xl bg-dark-3/50 hover:bg-dark-2/70 border border-dark-4/50 hover:border-dark-4 transition-all duration-200 group"
        onClick={handleBellClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Bell Icon with Animation */}
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-light-2 group-hover:text-light-1 transition-colors"
          >
            <path 
              d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        {/* Modern Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 flex items-center justify-center"
            >
              {/* Pulsing Background */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
              {/* Badge Content */}
              <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-dark-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 to-primary-600/0 group-hover:from-primary-500/10 group-hover:to-primary-600/10 transition-all duration-300" />
      </motion.button>

      {/* Modern Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute w-80 max-w-[calc(100vw-2rem)] bg-dark-2/95 backdrop-blur-lg border border-dark-4/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{
              left: window.innerWidth <= 640 ? '50%' : '100%',
              top: window.innerWidth <= 640 ? '100%' : 0,
              transform: window.innerWidth <= 640 ? 'translate(-50%, 0.5rem)' : 'translateX(0.5rem)',
              marginLeft: 0,
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-dark-4/50 bg-gradient-to-r from-dark-2 to-dark-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-light-1 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary-500">
                    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Notifications
                </h3>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full">
                    {notifications.filter(n => !n.read).length} new
                  </span>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-dark-3 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-light-4">
                        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-light-3 text-sm">No notifications yet</p>
                      <p className="text-light-4 text-xs mt-1">We'll notify you when something happens!</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="divide-y divide-dark-4/30">
                  {notifications.map((n: any, index: number) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-dark-3/30 transition-colors cursor-pointer ${
                        !n.read ? 'bg-primary-500/5 border-l-2 border-l-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <img
                            src={n.user?.image_url || "/assets/icons/profile-placeholder.svg"}
                            alt={n.user?.username || "User"}
                            className="w-10 h-10 rounded-full object-cover border border-dark-4"
                          />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-light-1">
                            {n.user?.username && (
                              <span className="font-semibold text-primary-400">{n.user.username}</span>
                            )}
                            {n.user?.username ? ' ' : ''}
                            <span className="text-light-2">{n.message}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-light-4">
                              {new Date(n.created_at).toLocaleString([], { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            {!n.read && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer (if needed) */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-dark-4/50 bg-dark-3/30">
                <button 
                  className="w-full text-xs text-light-3 hover:text-light-1 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  Close notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
