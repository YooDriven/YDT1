import React, { useState, useMemo } from 'react';
import { Page } from '../types';
import { ChevronLeftIcon } from '../components/icons';
import { supabase } from '../lib/supabaseClient';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Input, Skeleton } from '../components/ui';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { useGameplay } from '../contexts/GameplayContext';

const FriendsPage: React.FC = () => {
    const { navigateTo } = useApp();
    const { userProfile } = useAuth();
    const { friends, acceptFriendRequest, declineFriendRequest, removeFriend, sendFriendRequest, sendChallenge } = useSocial();
    const { handleDuel } = useGameplay();
    
    const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'add'>('friends');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    React.useEffect(() => {
        if (debouncedSearchTerm.length > 2) {
            setSearchLoading(true);
            supabase!.rpc('search_users', { p_search_term: debouncedSearchTerm, p_user_id: userProfile!.id })
                .then(({ data, error }) => {
                    if (error) console.error(error);
                    else setSearchResults(data || []);
                    setSearchLoading(false);
                });
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchTerm, userProfile]);

    const myFriends = useMemo(() => friends.filter(f => f.status === 'friends'), [friends]);
    const pendingRequests = useMemo(() => friends.filter(f => f.status === 'pending_received'), [friends]);
    
    const renderFriendsList = () => (
        <div className="space-y-3">
            {myFriends.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Your friends list is empty. Add some friends to start challenging them!</p>}
            {myFriends.map(friend => (
                <div key={friend.id} className="flex items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <img src={friend.avatarUrl} alt={friend.name} className="h-10 w-10 rounded-full mr-4" />
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{friend.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score: {friend.avgScore}%</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="primary" onClick={() => sendChallenge(friend.id)}>Challenge</Button>
                        <Button variant="danger" onClick={() => removeFriend(friend.id)}>Remove</Button>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderPendingRequests = () => (
        <div className="space-y-3">
             {pendingRequests.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No pending friend requests.</p>}
            {pendingRequests.map(request => (
                <div key={request.id} className="flex items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <img src={request.avatarUrl} alt={request.name} className="h-10 w-10 rounded-full mr-4" />
                    <p className="flex-1 font-semibold text-gray-900 dark:text-white">{request.name}</p>
                    <div className="flex gap-2">
                        <Button variant="primary" onClick={() => acceptFriendRequest(request.id)}>Accept</Button>
                        <Button variant="secondary" onClick={() => declineFriendRequest(request.id)}>Decline</Button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderAddFriend = () => (
        <div>
            <Input
                type="search"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="mt-4 space-y-3">
                {searchLoading && <Skeleton className="h-16 w-full" />}
                {searchResults.map(result => (
                    <div key={result.id} className="flex items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <img src={result.avatarurl} alt={result.name} className="h-10 w-10 rounded-full mr-4" />
                        <p className="flex-1 font-semibold text-gray-900 dark:text-white">{result.name}</p>
                        <Button onClick={() => sendFriendRequest(result.id)}>Add Friend</Button>
                    </div>
                ))}
                {debouncedSearchTerm.length > 2 && !searchLoading && searchResults.length === 0 && (
                     <p className="text-center text-gray-500 dark:text-gray-400 py-8">No users found.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigateTo(Page.Profile)} className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group">
                        <ChevronLeftIcon className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
                        <span className="text-base">Back to Profile</span>
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Friends</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    Connect with other users and challenge them to a battle.
                </p>
            </header>

            <main>
                <div className="mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-slate-700">
                    <button onClick={() => setActiveTab('friends')} className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'friends' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500'}`}>My Friends</button>
                    <button onClick={() => setActiveTab('pending')} className={`relative px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500'}`}>
                        Pending Requests
                        {pendingRequests.length > 0 && <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingRequests.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('add')} className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'add' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500'}`}>Add Friend</button>
                </div>
                {activeTab === 'friends' && renderFriendsList()}
                {activeTab === 'pending' && renderPendingRequests()}
                {activeTab === 'add' && renderAddFriend()}
            </main>
        </div>
    );
};

export default FriendsPage;