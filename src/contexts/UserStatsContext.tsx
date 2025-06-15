import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  confirmedApps: number;
  totalApps: number;
  unconfirmedApps: number;
  pendingReviews: number;
  teamStats?: any;
  achievements?: Achievement[];
  personalConfirmedApps?: number;
}

interface UserStatsContextType {
  stats: UserStats;
  loading: boolean;
  refreshStats: () => Promise<void>;
}

const defaultStats: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  confirmedApps: 0,
  totalApps: 0,
  unconfirmedApps: 0,
  pendingReviews: 0,
  teamStats: {},
  achievements: [],
  personalConfirmedApps: 0,
};

const UserStatsContext = createContext<UserStatsContextType>({
  stats: defaultStats,
  loading: false,
  refreshStats: async () => {},
});

export const useUserStats = () => useContext(UserStatsContext);

export const UserStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [loading, setLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/api/users/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      console.log('Stats response:', response.data);
      setStats({
        xp: response.data.xp || 0,
        level: response.data.level || 1,
        streak: response.data.streak || 0,
        confirmedApps: response.data.confirmedApps || 0,
        totalApps: response.data.totalApps || 0,
        unconfirmedApps: response.data.unconfirmedApps || 0,
        pendingReviews: response.data.pendingReviews || 0,
        teamStats: response.data.teamStats || {},
        achievements: response.data.achievements || [],
        personalConfirmedApps: response.data.personalConfirmedApps || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <UserStatsContext.Provider value={{ stats, loading, refreshStats }}>
      {children}
    </UserStatsContext.Provider>
  );
}; 