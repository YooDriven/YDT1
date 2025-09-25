import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';
import { useApp } from '../contexts/AppContext';

const useNotifications = (userId: string | undefined) => {
    const { supabase } = useApp();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching notifications:', error);
        } else {
            setNotifications(data as Notification[]);
        }
    }, [userId, supabase]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel(`notifications-${userId}`);
        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
            (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
            (payload) => {
                 setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);
    
    const markNotificationAsRead = async (notificationId: string) => {
        const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
        if (error) {
            console.error("Error deleting notification:", error);
        }
    };

    return { notifications, fetchNotifications, markNotificationAsRead };
};

export default useNotifications;