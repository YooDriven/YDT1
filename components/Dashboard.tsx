import React, { useState, useEffect } from 'react';
import StudentProfileCard from './StudentProfileCard';
import TestCard from './TestCard';
import { PRIMARY_TEST_CARDS } from '../constants';
import type { LeaderboardEntry, Page, TestCardData, UserProfile, AppAssetRecord } from '../types';
import { supabase } from '../lib/supabaseClient';

interface DashboardProps {
  onCardClick: (card: TestCardData) => void;
  userProfile: UserProfile;
  navigateTo: (page: Page) => void;
  handleDuel: (opponent: LeaderboardEntry) => void;
  appAssets: AppAssetRecord;
}

const Dashboard: React.FC<DashboardProps> = ({ onCardClick, userProfile, navigateTo, handleDuel, appAssets }) => {
  const [nationalLeaderboard, setNationalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [regionalLeaderboard, setRegionalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoadingLeaderboards(true);
      
      // For demonstration, we'll fetch the top 10 nationally.
      // A real app might fetch based on user's region or rank.
      const { data, error } = await supabase!
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
          isUser: profile.id === userProfile.id,
        }));
        setNationalLeaderboard(formattedLeaderboard);
        // For now, we'll use the same data for regional for simplicity
        setRegionalLeaderboard(formattedLeaderboard.slice(0, 7)); 
      }
      setLoadingLeaderboards(false);
    };

    if (userProfile.id) {
      fetchLeaderboards();
    }
  }, [userProfile.id]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isDailyChallengeCompleted = userProfile.lastDailyChallengeDate === todayStr;

  const getCard = (id: string) => PRIMARY_TEST_CARDS.find(c => c.id === id);

  const dailyChallengeCard = getCard('daily-challenge');
  const battleGroundCard = getCard('battle-ground');
  const timed3MinCard = getCard('timed-3');
  const timed6MinCard = getCard('timed-6');
  const timed9MinCard = getCard('timed-9');
  const mockTestCard = getCard('mock-test');

  const primaryCards = [
    dailyChallengeCard,
    battleGroundCard,
    timed3MinCard,
    timed6MinCard,
    timed9MinCard,
    mockTestCard,
  ].filter(Boolean) as TestCardData[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4 xl:col-span-3 mb-8 lg:mb-0">
          <StudentProfileCard 
            user={userProfile} 
            navigateTo={navigateTo} 
            nationalLeaderboard={nationalLeaderboard} 
            regionalLeaderboard={regionalLeaderboard}
            handleDuel={handleDuel}
            appAssets={appAssets}
          />
        </div>
        <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 gap-6 auto-rows-fr">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {dailyChallengeCard && <TestCard card={dailyChallengeCard} index={0} onClick={onCardClick} completed={isDailyChallengeCompleted} appAssets={appAssets} />}
            {battleGroundCard && <TestCard card={battleGroundCard} index={1} onClick={onCardClick} appAssets={appAssets} />}
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {timed3MinCard && <TestCard card={timed3MinCard} index={2} onClick={onCardClick} appAssets={appAssets} />}
            {timed6MinCard && <TestCard card={timed6MinCard} index={3} onClick={onCardClick} appAssets={appAssets} />}
            {timed9MinCard && <TestCard card={timed9MinCard} index={4} onClick={onCardClick} appAssets={appAssets} />}
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-1 gap-6">
            {mockTestCard && <TestCard card={mockTestCard} index={5} onClick={onCardClick} appAssets={appAssets} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;