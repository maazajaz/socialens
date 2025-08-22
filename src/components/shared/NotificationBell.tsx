
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/SupabaseAuthContext";
// @ts-ignore
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

type Notification = {
  id: string;
  type: string;
  message: string;
  user_id: string;
  user_name?: string;
  target_user_id: string;
  post_id?: string;
  comment_id?: string;
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
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `target_user_id=eq.${user.id}` },
        async () => {
          // Fetch latest notifications in real time
          const res = await supabase
            .from('notifications')
            .select('*, user:users!notifications_user_id_fkey(id, name, username, image_url)')
            .eq('target_user_id', user.id)
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
        .select('*, user:users!notifications_user_id_fkey(id, name, username, image_url)') // Join users table on user_id
        .eq('target_user_id', user.id)
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
        .select('*, user:users!notifications_user_id_fkey(id, name, username, image_url)')
        .eq('target_user_id', user.id)
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
          .eq('target_user_id', user.id);
      }
    }
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button className="relative" onClick={handleBellClick}>
        <img src="/assets/icons/bell.svg" alt="Notifications" className="h-7 w-7" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1  text-red text-xs  border-red
          ">{unreadCount}</span>
        )}
      </button>
      {showDropdown && (
        <div
          className="absolute w-80 bg-dark-2 rounded-lg shadow-lg z-50"
          style={{
            left: window.innerWidth <= 640 ? '50%' : '100%',
            top: window.innerWidth <= 640 ? '100%' : 0,
            transform: window.innerWidth <= 640 ? 'translate(-50%, 0)' : 'none',
            marginLeft: window.innerWidth <= 640 ? 0 : '0.5rem',
          }}
        >
          <div className="p-3 border-b border-dark-4 font-semibold text-light-1">Notifications</div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-4 text-light-3">No notifications</li>
            ) : (
              notifications.map((n: any) => (
                <li key={n.id} className={`p-4 border-b border-dark-4 ${!n.read ? 'bg-dark-3' : ''}`}>
                  <div className="text-light-1 text-sm">
                    {n.user?.username ? (
                      <span className="font-semibold text-primary-500">{n.user.username}</span>
                    ) : null}
                    {n.user?.username ? ' ' : ''}{n.message}
                  </div>
                  <div className="text-xs text-light-3 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
