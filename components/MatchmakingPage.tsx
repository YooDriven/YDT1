import React, { useEffect, useState, useRef } from 'react';
import { Page, UserProfile, Opponent } from '../types';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from 'https://esm.sh/@supabase/supabase-js@2';

interface MatchmakingPageProps {
  navigateTo: (page: Page) => void;
  onMatchFound: (battleId: string, opponent: Opponent) => void;
  user: UserProfile;
}

const matchmakingSteps = [
    { text: "Searching for opponent...", duration: 20000 },
    { text: "Opponent found!", duration: 1500 },
    { text: "Starting match...", duration: 1000 },
];

const opponentNames = ["RoadRunner", "DriftKing", "CaptainClutch", "SpeedyGonzales"];

const MatchmakingPage: React.FC<MatchmakingPageProps> = ({ navigateTo, onMatchFound, user }) => {
    const [statusText, setStatusText] = useState("Connecting to lobby...");
    const channelRef = useRef<RealtimeChannel | null>(null);
    // FIX: Changed NodeJS.Timeout to number, as setTimeout in browsers returns a number.
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const lobbyChannel = supabase!.channel('public-lobby', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });
        channelRef.current = lobbyChannel;

        const handleMatchBroadcast = ({ payload }: { payload: any }) => {
            if (payload.player1.id === user.id || payload.player2.id === user.id) {
                // We've been matched by someone else
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                const opponent = payload.player1.id === user.id ? payload.player2 : payload.player1;
                setStatusText(`Opponent found: ${opponent.name}!`);
                setTimeout(() => onMatchFound(payload.battleId, opponent), 1000);
            }
        };

        lobbyChannel.on('broadcast', { event: 'match-found' }, handleMatchBroadcast);
        
        lobbyChannel.on('presence', { event: 'sync' }, () => {
            // FIX: Call presenceState() without generics and cast the result to handle potential type definition issues.
            const presenceState = lobbyChannel.presenceState() as { [key: string]: { user_id: string; name: string; avatar_url: string }[] };
            const otherPlayers = Object.values(presenceState).map(p => p[0]).filter(p => p.user_id !== user.id);
            
            if (otherPlayers.length > 0) {
                 // Found an opponent, initiate the match
                if (timeoutRef.current) clearTimeout(timeoutRef.current);

                const opponentData = otherPlayers[0];
                const battleId = `battle-${[user.id, opponentData.user_id].sort().join('-')}`;
                
                const matchPayload = {
                    battleId,
                    player1: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
                    player2: { id: opponentData.user_id, name: opponentData.name, avatarUrl: opponentData.avatar_url },
                };
                
                lobbyChannel.send({ type: 'broadcast', event: 'match-found', payload: matchPayload });
            }
        });

        lobbyChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                setStatusText("Searching for opponent...");
                await lobbyChannel.track({ user_id: user.id, name: user.name, avatar_url: user.avatarUrl });

                // Set a timeout to match with a bot if no one is found
                if (!timeoutRef.current) {
                    timeoutRef.current = setTimeout(() => {
                        const botName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
                        const botOpponent: Opponent = {
                            name: botName,
                            avatarUrl: `https://api.dicebear.com/8.x/bottts/svg?seed=${botName}`,
                            isBot: true,
                        };
                        const battleId = `battle-bot-${user.id}-${Date.now()}`;
                        setStatusText("No players found, matching with a bot...");
                        setTimeout(() => onMatchFound(battleId, botOpponent), 1000);
                    }, 20000); // 20-second timeout
                }
            } else {
                 setStatusText("Failed to connect to lobby. Please try again.");
            }
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (channelRef.current) {
                supabase?.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };

    }, [user, onMatchFound, navigateTo]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] text-center">
        <div className="relative flex items-center justify-center h-40 w-40">
            <div className="absolute h-full w-full rounded-full bg-teal-500/20 animate-ping"></div>
            <div className="absolute h-28 w-28 rounded-full bg-teal-500/30 animate-ping delay-150"></div>
            <p className="text-5xl font-bold text-gray-800 dark:text-white">VS</p>
        </div>

      <h1 className="text-3xl font-bold mt-10 transition-opacity duration-500 text-gray-900 dark:text-white tracking-tight">
        {statusText}
      </h1>

      <button
        onClick={() => navigateTo(Page.Dashboard)}
        className="mt-12 px-6 py-3 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white transition-all duration-200 hover:scale-105"
      >
        Cancel Search
      </button>
    </div>
  );
};

export default MatchmakingPage;