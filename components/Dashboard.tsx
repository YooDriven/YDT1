
import React, { useState, useEffect } from 'react';
import StudentProfileCard from './StudentProfileCard';
import TestCard from './TestCard';
import { PRIMARY_TEST_CARDS } from '../constants';
import type { LeaderboardEntry } from '../types';
import { useApp } from '../contexts/AppContext';
import { useGlobalState } from '../contexts/GlobalStateContext';

const useLeaderboard = (userId: string | undefined) => {
    const { supabase } = useApp();
    const [nationalLeaderboard, setNationalLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [regionalLeaderboard, setRegionalLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboards = async () => {
            if (!userId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avgScore, avatarUrl')
                .order('avgScore', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching leaderboards:', error);
            } else if (data) {
                const formattedLeaderboard = data.map((profile, index) => ({
                    id: profile.id,
                    rank: index + 1,
                    name: profile.name,
                    score: profile.avgScore,
                    avatarUrl: profile.avatarUrl,
                    isUser: profile.id === userId,
                }));
                setNationalLeaderboard(formattedLeaderboard);
                setRegionalLeaderboard(formattedLeaderboard.slice(0, 7));
            }
            setLoading(false);
        };
        fetchLeaderboards();
    }, [userId, supabase]);
    
    return { nationalLeaderboard, regionalLeaderboard, loading };
};


const Dashboard: React.FC = () => {
  const { userProfile, handleCardClick } = useGlobalState();
  const { appAssets } = useApp();
  const { nationalLeaderboard, regionalLeaderboard, loading: loadingLeaderboards } = useLeaderboard(userProfile?.id);

  if (!userProfile) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isDailyChallengeCompleted = userProfile.lastDailyChallengeDate === todayStr;

  const primaryCards = PRIMARY_TEST_CARDS.filter(Boolean);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4 xl:col-span-3 mb-8 lg:mb-0">
          <StudentProfileCard 
            loading={loadingLeaderboards}
            nationalLeaderboard={nationalLeaderboard} 
            regionalLeaderboard={regionalLeaderboard}
          />
        </div>
        <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 gap-6 auto-rows-fr">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {primaryCards.slice(0, 2).map((card, index) => (
                  <TestCard 
                    key={card.id} 
                    card={card} 
                    index={index} 
                    onClick={handleCardClick} 
                    completed={card.id === 'daily-challenge' && isDailyChallengeCompleted} 
                    appAssets={appAssets} 
                  />
              ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {primaryCards.slice(2, 5).map((card, index) => (
                  <TestCard 
                    key={card.id} 
                    card={card} 
                    index={index + 2} 
                    onClick={handleCardClick} 
                    appAssets={appAssets} 
                  />
              ))}
          </div>
          <div className="grid grid-cols-1 gap-6">
              {primaryCards.slice(5).map((card, index) => (
                  <TestCard 
                    key={card.id} 
                    card={card} 
                    index={index + 5} 
                    onClick={handleCardClick} 
                    appAssets={appAssets} 
                  />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
