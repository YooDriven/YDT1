import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Friend } from '../types';

const useFriends = (userId: string | undefined, showToast: (message: string, type?: 'success' | 'error') => void) => {
    const [friends, setFriends] = useState<Friend[]>([]);

    const fetchFriends = useCallback(async () => {
        if (!userId) return;
        const { data, error } = await supabase!.rpc('get_friends_status', { p_user_id: userId });
        if (error) {
            console.error('Error fetching friends:', error);
        } else {
            setFriends(data as Friend[]);
        }
    }, [userId]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);
    
    useEffect(() => {
        if (!userId) return;

        const subscription = supabase!.channel(`friends-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `user1_id=eq.${userId}`
            }, () => fetchFriends())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `user2_id=eq.${userId}`
            }, () => fetchFriends())
            .subscribe();

        return () => {
            supabase?.removeChannel(subscription);
        };
    }, [userId, fetchFriends]);

    const sendFriendRequest = async (friendId: string) => {
        if (!userId) return;
        const { error } = await supabase!.from('friends').insert({ user1_id: userId, user2_id: friendId, status: 'pending' });
        if (error) {
            showToast('Failed to send friend request.', 'error');
        } else {
            showToast('Friend request sent!');
            fetchFriends();
        }
    };
    
    const acceptFriendRequest = async (friendId: string) => {
        if (!userId) return;
        const { error } = await supabase!.from('friends').update({ status: 'friends' }).match({ user1_id: friendId, user2_id: userId });
        if (error) {
            showToast('Failed to accept friend request.', 'error');
        } else {
            showToast('Friend request accepted!');
            fetchFriends();
        }
    };

    const declineFriendRequest = async (friendId: string) => {
        if (!userId) return;
        const { error } = await supabase!.from('friends').delete().match({ user1_id: friendId, user2_id: userId });
        if (error) {
            showToast('Failed to decline friend request.', 'error');
        } else {
            showToast('Friend request declined.');
            fetchFriends();
        }
    };
    
    const removeFriend = async (friendId: string) => {
        if (!userId) return;
        const { error } = await supabase!.rpc('remove_friend', { p_user_id: userId, p_friend_id: friendId });
        if (error) {
            showToast('Failed to remove friend.', 'error');
        } else {
            showToast('Friend removed.');
            fetchFriends();
        }
    };

    return { friends, fetchFriends, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend };
};

export default useFriends;
