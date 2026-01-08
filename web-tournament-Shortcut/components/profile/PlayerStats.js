// components/profile/PlayerStats.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, Trophy, Shield, Award, Target, Activity, 
  Calendar, Clock, Flame, BarChart2, PieChart as PieChartIcon
} from 'lucide-react';

const PlayerStats = ({ user, matchHistory = [] }) => {
  const { t } = useTranslation('profile');
  const [activeChart, setActiveChart] = useState('elo');
  const [timeRange, setTimeRange] = useState('all');
  const [eloHistory, setEloHistory] = useState([]);
  const [matchDistribution, setMatchDistribution] = useState([]);
  const [performanceByOpponentRank, setPerformanceByOpponentRank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load additional match data if needed
  useEffect(() => {
    const loadAllMatches = async () => {
      if (!user?.iduser) return;
      
      try {
        setLoading(true);
        // Load all matches for this user
        const response = await fetch(`/api/users/${user.iduser}/matches?limit=100`);
        const data = await response.json();
        
        if (data.success) {
          // Generate chart data based on all matches
          generateChartData(data.matches || []);
        } else {
          setError("Couldn't load match data");
          // Fallback to using initial matches
          generateChartData(matchHistory);
        }
      } catch (error) {
        console.error("Error loading matches:", error);
        // Fallback to using initial matches
        generateChartData(matchHistory);
      } finally {
        setLoading(false);
      }
    };
    
    if (isClient) {
      loadAllMatches();
    }
  }, [user?.iduser, matchHistory, isClient]);

  // Generate all chart data
  const generateChartData = (matches) => {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      setEloHistory([]);
      setMatchDistribution({ dayOfWeek: [], timeOfDay: [] });
      setPerformanceByOpponentRank([]);
      return;
    }
    
    try {
      // Generate ELO history data
      generateEloHistory(matches);
      // Generate match distribution data
      generateMatchDistribution(matches);
      // Generate performance by rank data
      generatePerformanceByRank(matches);
    } catch (error) {
      console.error("Error generating chart data:", error);
      setError("Error processing match data");
    }
  };

  // Generate ELO history data
  const generateEloHistory = (matches) => {
    if (!matches || matches.length === 0) {
      setEloHistory([]);
      return;
    }
    
    // Sort matches by date
    const sortedMatches = [...matches].sort((a, b) => {
      const dateA = new Date(a.completedAt || a.createdAt || 0);
      const dateB = new Date(b.completedAt || b.createdAt || 0);
      return dateA - dateB;
    });
    
    // Estimate starting ELO
    const startingElo = user.elo || 1000;
    let currentElo = startingElo - sortedMatches.reduce((sum, match) => {
      return sum + (match.winner === user.iduser ? 15 : -10);
    }, 0);
    
    // Ensure minimum ELO is 1000
    currentElo = Math.max(1000, currentElo);
    
    // Create ELO history points, simplifying by only keeping key points
    // rather than every single match to improve chart performance
    const historyPoints = [];
    
    // Add starting point
    historyPoints.push({
      date: new Date(sortedMatches[0]?.createdAt || Date.now() - 90*24*60*60*1000),
      elo: currentElo,
      formattedDate: "Start"
    });
    
    // Calculate step size based on matches count
    const matchCount = sortedMatches.length;
    const stepSize = matchCount > 50 ? Math.floor(matchCount / 15) : 1;
    
    sortedMatches.forEach((match, index) => {
      // Update ELO
      currentElo += match.winner === user.iduser ? 15 : -10;
      
      // Only add points at regular intervals to avoid overloading the chart
      if (index % stepSize === 0 || index === sortedMatches.length - 1) {
        const matchDate = new Date(match.completedAt || match.createdAt);
        
        // Format date for display
        const formattedDate = matchDate.toLocaleDateString(undefined, {
          month: 'short', day: 'numeric'
        });
        
        historyPoints.push({
          date: matchDate,
          elo: currentElo,
          formattedDate,
          isWin: match.winner === user.iduser
        });
      }
    });
    
    // Add current ELO as final point
    historyPoints.push({
      date: new Date(),
      elo: user.elo,
      formattedDate: "Current",
      isWin: null
    });
    
    setEloHistory(historyPoints);
  };

  // Generate match distribution data
  const generateMatchDistribution = (matches) => {
    if (!matches || matches.length === 0) {
      setMatchDistribution({ dayOfWeek: [], timeOfDay: [] });
      return;
    }
    
    // Define day names and time periods
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames.map(day => ({
      name: day,
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0
    }));
    
    const timeOfDay = [
      { name: 'Morning (6-12)', range: [6, 12], wins: 0, losses: 0, total: 0, winRate: 0 },
      { name: 'Afternoon (12-18)', range: [12, 18], wins: 0, losses: 0, total: 0, winRate: 0 },
      { name: 'Evening (18-24)', range: [18, 24], wins: 0, losses: 0, total: 0, winRate: 0 },
      { name: 'Night (0-6)', range: [0, 6], wins: 0, losses: 0, total: 0, winRate: 0 }
    ];
    
    // Count matches by day and time
    matches.forEach(match => {
      try {
        const date = new Date(match.completedAt || match.createdAt || 0);
        if (isNaN(date.getTime())) return;
        
        const day = date.getDay();
        const hour = date.getHours();
        const isWin = match.winner === user.iduser;
        
        // Update day of week counts
        if (day >= 0 && day < 7) {
          dayOfWeek[day].total += 1;
          if (isWin) {
            dayOfWeek[day].wins += 1;
          } else {
            dayOfWeek[day].losses += 1;
          }
        }
        
        // Update time of day counts
        const timeSlot = timeOfDay.find(slot => hour >= slot.range[0] && hour < slot.range[1]);
        if (timeSlot) {
          timeSlot.total += 1;
          if (isWin) {
            timeSlot.wins += 1;
          } else {
            timeSlot.losses += 1;
          }
        }
      } catch (error) {
        console.error('Error processing match for distribution:', error);
      }
    });
    
    // Calculate win rates
    dayOfWeek.forEach(day => {
      day.winRate = day.total > 0 ? Math.round((day.wins / day.total) * 100) : 0;
    });
    
    timeOfDay.forEach(slot => {
      slot.winRate = slot.total > 0 ? Math.round((slot.wins / slot.total) * 100) : 0;
    });
    
    setMatchDistribution({ dayOfWeek, timeOfDay });
  };

  // Generate performance by opponent rank data
  const generatePerformanceByRank = (matches) => {
    if (!matches || matches.length === 0) {
      setPerformanceByOpponentRank([]);
      return;
    }
    
    // Define ranks
    const ranks = ['diamond', 'platinum', 'gold', 'silver', 'bronze', 'unranked'];
    const statsByRank = ranks.map(rank => ({
      name: rank.charAt(0).toUpperCase() + rank.slice(1),
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0
    }));
    
    // Count matches by opponent rank
    matches.forEach(match => {
      if (!match.opponent || !match.opponent.rank) return;
      
      const opponentRank = match.opponent.rank.toLowerCase();
      const rankIndex = ranks.indexOf(opponentRank);
      if (rankIndex === -1) return;
      
      const isWin = match.winner === user.iduser;
      
      statsByRank[rankIndex].total += 1;
      if (isWin) {
        statsByRank[rankIndex].wins += 1;
      } else {
        statsByRank[rankIndex].losses += 1;
      }
    });
    
    // Calculate win rates and filter out ranks with no matches
    const filteredStats = statsByRank
      .map(rank => ({
        ...rank,
        winRate: rank.total > 0 ? Math.round((rank.wins / rank.total) * 100) : 0
      }))
      .filter(rank => rank.total > 0);
    
    setPerformanceByOpponentRank(filteredStats);
  };

  // Get rank color
  const getRankColor = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'diamond': return '#0EA5E9';
      case 'platinum': return '#818CF8';
      case 'gold': return '#F59E0B';
      case 'silver': return '#9CA3AF';
      case 'bronze': return '#B45309';
      default: return '#6B7280';
    }
  };

  // Calculate streaks
  const calculateStreaks = (matches) => {
    if (!matches || matches.length === 0) {
      return { currentStreak: 0, longestStreak: 0, currentStreakType: null };
    }
    
    // Sort by date descending (newest first)
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let currentStreakType = null;
    
    // Calculate current streak
    for (const match of sortedMatches) {
      const isWin = match.winner === user.iduser;
      
      if (currentStreakType === null) {
        currentStreakType = isWin;
        currentStreak = 1;
      } else if (currentStreakType === isWin) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest win streak
    let tempStreak = 0;
    
    for (const match of sortedMatches) {
      const isWin = match.winner === user.iduser;
      
      if (isWin) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return { 
      currentStreak,
      currentStreakType,
      longestStreak
    };
  };

  // Calculate stats
  const winCount = matchHistory.filter(match => match.winner === user.iduser).length;
  const lossCount = matchHistory.length - winCount;
  const winRate = matchHistory.length > 0 ? (winCount / matchHistory.length) * 100 : 0;
  const { currentStreak, currentStreakType, longestStreak } = calculateStreaks(matchHistory);
  
  // Calculate average match duration
  const avgMatchDuration = () => {
    const matchesWithDuration = matchHistory.filter(match => match.duration);
    if (matchesWithDuration.length === 0) return 0;
    
    const totalDuration = matchesWithDuration.reduce((sum, match) => sum + match.duration, 0);
    return Math.round(totalDuration / matchesWithDuration.length);
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Win/loss pie chart data
  const winLossData = [
    { name: t('victories'), value: winCount, color: '#10B981' },
    { name: t('defeats'), value: lossCount, color: '#EF4444' }
  ];
  
  // Colors for charts
  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}: </span> 
              {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render fallback UI while loading
  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="h-72 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header with title and time range selector */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-500" />
            {t('performance_analytics')}
          </h2>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="all">{t('all_time')}</option>
            <option value="year">{t('last_year')}</option>
            <option value="month">{t('last_month')}</option>
            <option value="week">{t('last_week')}</option>
          </select>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* ELO Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 rounded-tl-full bg-blue-200/50 dark:bg-blue-700/30 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white mr-2">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300">ELO</h4>
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-200">{user.elo || 1000}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {user.rank && (
                  <span className="capitalize">{user.rank} {t('rank')}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Winrate Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 rounded-tl-full bg-green-200/50 dark:bg-green-700/30 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-green-600 dark:bg-green-700 flex items-center justify-center text-white mr-2">
                  <Trophy className="h-4 w-4" />
                </div>
                <h4 className="font-medium text-green-800 dark:text-green-300">{t('winrate')}</h4>
              </div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-200">{winRate.toFixed(1)}%</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {winCount} {t('wins')} / {lossCount} {t('losses')}
              </div>
            </div>
          </div>
          
          {/* Current Streak Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 rounded-tl-full bg-amber-200/50 dark:bg-amber-700/30 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-600 dark:bg-amber-700 flex items-center justify-center text-white mr-2">
                  <Flame className="h-4 w-4" />
                </div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">{t('current_streak')}</h4>
              </div>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-200">{currentStreak}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {currentStreakType === true ? t('consecutive_wins') : t('consecutive_losses')}
              </div>
            </div>
          </div>
          
          {/* Best Streak Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 rounded-tl-full bg-purple-200/50 dark:bg-purple-700/30 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 dark:bg-purple-700 flex items-center justify-center text-white mr-2">
                  <Award className="h-4 w-4" />
                </div>
                <h4 className="font-medium text-purple-800 dark:text-purple-300">{t('best_streak')}</h4>
              </div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-200">{longestStreak}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {t('longest_win_streak')}
              </div>
            </div>
          </div>
        </div>
        
        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Matches */}
          <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('total_matches')}</h4>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{matchHistory.length}</div>
          </div>
          
          {/* Average Match Duration */}
          <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('avg_match_duration')}</h4>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatDuration(avgMatchDuration())}</div>
          </div>
          
          {/* Active Since */}
          <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('active_since')}</h4>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
        
        {/* Chart Selection Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveChart('elo')}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeChart === 'elo' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-1" />
            {t('elo_evolution')}
          </button>
          <button
            onClick={() => setActiveChart('performance')}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeChart === 'performance' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <BarChart2 className="h-4 w-4 inline mr-1" />
            {t('performance_by_rank')}
          </button>
          <button
            onClick={() => setActiveChart('distribution')}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeChart === 'distribution' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <PieChartIcon className="h-4 w-4 inline mr-1" />
            {t('match_distribution')}
          </button>
        </div>
        
        {/* Chart Display */}
        <div className="h-80 w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
              <p className="ml-3 text-gray-500 dark:text-gray-400">{t('loading_charts')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p className="text-red-500 mb-2">{error}</p>
              <p>{t('error_loading_charts')}</p>
            </div>
          ) : activeChart === 'elo' ? (
            eloHistory.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eloHistory}>
                  <defs>
                    <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" />
                  <XAxis 
                    dataKey="formattedDate" 
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="elo"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#eloGradient)"
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                    name="ELO"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>{t('not_enough_match_data')}</p>
              </div>
            )
          ) : activeChart === 'performance' ? (
            performanceByOpponentRank.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceByOpponentRank}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" />
                  <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" label={{ value: t('win_rate'), angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="winRate" name={t('win_percentage')} fill="#10B981" barSize={30}>
                    {performanceByOpponentRank.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRankColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>{t('not_enough_match_data')}</p>
              </div>
            )
          ) : ( // Distribution chart
            matchHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Win/Loss Distribution Pie Chart */}
                <div className="flex flex-col items-center h-full">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('win_loss_ratio')}</h4>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {winLossData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Best Performance Times */}
                <div className="flex flex-col h-full">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">{t('best_performance_times')}</h4>
                  <div className="flex-1 overflow-auto">
                    {matchDistribution && matchDistribution.timeOfDay && matchDistribution.timeOfDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={matchDistribution.timeOfDay}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" />
                          <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                          <YAxis className="text-gray-600 dark:text-gray-400" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="winRate" name={t('win_percentage')} fill="#3B82F6" />
                          <Bar dataKey="total" name={t('matches')} fill="#9CA3AF" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p>{t('not_enough_match_data')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>{t('not_enough_match_data')}</p>
              </div>
            )
          )}
        </div>
        
        
      </div>
    </div>
  );
};

export default PlayerStats;