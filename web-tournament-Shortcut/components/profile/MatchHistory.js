// components/profile/MatchHistory.js
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, Filter, Calendar, ChevronDown, ChevronUp,
  ChevronRight, Trophy, Clock, RefreshCw,
  Shield, Award, Users
} from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function MatchHistory({ 
  userId, 
  initialMatches = [], 
  limit = 10,
  expandable = true 
}) {
  const { t } = useTranslation('profile');
  const [matches, setMatches] = useState([]);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'wins', 'losses'
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', 'year'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isClient, setIsClient] = useState(false);
  
  // Handle client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load all match data on component mount
  useEffect(() => {
    if (isClient && userId) {
      loadAllMatches();
    } else if (isClient) {
      // Use initial matches if provided
      setMatches(initialMatches || []);
      setTotalMatches(initialMatches.length || 0);
      setLoading(false);
    }
  }, [isClient, userId, initialMatches]);

  // Function to load all matches for a user
  const loadAllMatches = async () => {
    if (!userId || !isClient) return;
    
    setLoading(true);
    try {
      // Request a higher limit to get more matches at once
      const fetchLimit = 100;
      
      // Make the API call
      const response = await fetch(`/api/users/${userId}/matches?limit=${fetchLimit}`);
      const data = await response.json();
      
      if (data.success) {
        // Store the fetched matches
        const validMatches = data.matches.filter(match => 
          match.opponent // Make sure we have opponent data
        );
        
        setMatches(validMatches);
        setTotalMatches(data.total || validMatches.length);
      } else {
        // If API call fails, fallback to initial matches
        setMatches(initialMatches || []);
        setTotalMatches(initialMatches.length || 0);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches(initialMatches || []);
      setTotalMatches(initialMatches.length || 0);
    } finally {
      setLoading(false);
    }
  };

  // Toggle match details
  const toggleMatchDetails = (matchId) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  // Apply date filter
  const getDateFilteredMatches = (matchList) => {
    if (dateFilter === 'all') return matchList;
    
    const now = new Date();
    let cutoffDate;
    
    switch (dateFilter) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return matchList;
    }
    
    return matchList.filter(match => {
      const matchDate = new Date(match.completedAt || match.createdAt);
      return matchDate >= cutoffDate;
    });
  };

  // Apply all filters and sorting
  const getFilteredAndSortedMatches = () => {
    // Step 1: Filter by win/loss status
    let result = matches.filter(match => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'wins') return match.winner === userId;
      return match.winner !== userId;
    });
    
    // Step 2: Filter by search term (opponent name)
    result = result.filter(match => {
      if (!searchTerm) return true;
      const opponentName = match.opponent?.pseudo || '';
      return opponentName.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    // Step 3: Apply date filter
    result = getDateFilteredMatches(result);
    
    // Step 4: Sort by date
    result = result.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.createdAt || 0);
      const dateB = new Date(b.completedAt || b.createdAt || 0);
      
      // Handle invalid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0; // Keep original order
      }
      
      return sortOrder === 'newest' 
        ? dateB - dateA 
        : dateA - dateB;
    });
    
    return result;
  };

  // Get the current page of matches
  const getCurrentPageMatches = () => {
    const filteredMatches = getFilteredAndSortedMatches();
    
    // If showing all, return all filtered matches
    if (showAll) return filteredMatches;
    
    // Otherwise paginate
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMatches.slice(startIndex, startIndex + pageSize);
  };

  // Format match duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format date for consistent display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      
      return date.toLocaleDateString(undefined, { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e, dateString);
      return 'Unknown date';
    }
  };

  // Get the rank color class
  const getRankColorClass = (rank) => {
    const rankClasses = {
      diamond: 'text-cyan-500 border-cyan-200 bg-cyan-50 dark:bg-cyan-900/30',
      platinum: 'text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30',
      gold: 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/30',
      silver: 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-800',
      bronze: 'text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-900/30',
      unranked: 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-800'
    };
    
    return rankClasses[rank?.toLowerCase()] || rankClasses.unranked;
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(getFilteredAndSortedMatches().length / pageSize);

  // If not in a client-side environment, render a loading placeholder
  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header with advanced filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-red-500" />
            {t('match_history')}
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('search_opponent')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-8 pr-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 w-32 sm:w-40"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            
            {/* Result filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">{t('all_matches')}</option>
              <option value="wins">{t('victories')}</option>
              <option value="losses">{t('defeats')}</option>
            </select>
            
            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">{t('all_time')}</option>
              <option value="week">{t('last_week')}</option>
              <option value="month">{t('last_month')}</option>
              <option value="year">{t('last_year')}</option>
            </select>
            
            {/* Sort order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="newest">{t('newest_first')}</option>
              <option value="oldest">{t('oldest_first')}</option>
            </select>
            
            {/* Refresh button */}
            <button
              onClick={loadAllMatches}
              disabled={loading}
              className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              title={t('refresh')}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Results info */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        {getFilteredAndSortedMatches().length > 0 ? (
          <div className="flex justify-between items-center">
            <span>
              {showAll 
                ? t('showing_all_matches', { count: getFilteredAndSortedMatches().length })
                : t('showing_page', { 
                    start: ((currentPage - 1) * pageSize) + 1,
                    end: Math.min(currentPage * pageSize, getFilteredAndSortedMatches().length),
                    total: getFilteredAndSortedMatches().length
                  })
              }
              {filterStatus !== 'all' && ` (${filterStatus === 'wins' ? t('victories') : t('defeats')})`}
              {dateFilter !== 'all' && ` - ${t(dateFilter)}`}
            </span>
            
            {/* Pagination controls */}
            {!showAll && totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  &lt;
                </button>
                
                <span>{currentPage} / {totalPages}</span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        ) : (
          <span>{t('no_matches_found')}</span>
        )}
      </div>
      
      {/* Match cards */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">{t('loading_matches')}</p>
          </div>
        ) : getCurrentPageMatches().length > 0 ? (
          <div className="space-y-4">
            {getCurrentPageMatches().map(match => {
              const isWinner = match.winner === userId;
              const opponentName = match.opponent?.pseudo || 'Unknown Trainer';
              const matchDate = formatDate(match.completedAt || match.updatedAt || match.createdAt);
              const hasExpanded = expandedMatchId === (match.id || match.matchId);
              
              return (
                <div 
                  key={match.id || match.matchId}
                  className={`rounded-lg border transition hover:shadow-md ${
                    isWinner 
                      ? 'border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-800' 
                      : 'border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-gray-800'
                  }`}
                >
                  {/* Match header with basic info */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Result indicator */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isWinner 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {isWinner ? <Award className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                      </div>
                      
                      {/* Opponent info */}
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {isWinner ? t('victory_against') : t('defeat_by')} <Link href={`/profile/${match.opponent?.id}`}>
                            <span className="text-blue-600 dark:text-blue-400 hover:underline">{opponentName}</span>
                          </Link>
                        </div>
                        <div className="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {matchDate}
                          </span>
                          {match.duration && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(match.duration)}
                            </span>
                          )}
                          {match.opponent?.rank && (
                            <span className={`px-1.5 py-0.5 rounded capitalize ${getRankColorClass(match.opponent.rank)}`}>
                              {match.opponent.rank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side with expand button */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleMatchDetails(match.id || match.matchId)}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label={hasExpanded ? t('hide_details') : t('show_details')}
                      >
                        {hasExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {hasExpanded && (
                    <div className="px-4 pb-4">
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Opponent card */}
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('opponent_details')}
                            </h4>
                            <div className="flex items-center">
                              <Link href={`/profile/${match.opponent?.id}`}>
                                <div className="w-16 h-16 rounded-full overflow-hidden mr-3 border-2 border-gray-200 dark:border-gray-700">
                                  <Image 
                                    src={match.opponent?.avatar || '/images/default-avatar.png'} 
                                    alt={opponentName}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </Link>
                              <div>
                                <Link href={`/profile/${match.opponent?.id}`}>
                                  <h5 className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{opponentName}</h5>
                                </Link>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {match.opponent?.rank && (
                                    <span className={`px-1.5 py-0.5 text-xs rounded capitalize ${getRankColorClass(match.opponent.rank)}`}>
                                      {match.opponent.rank}
                                    </span>
                                  )}
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    ELO: {match.opponent?.elo || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Match details card */}
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('match_details')}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('result')}</div>
                                <div className={`font-medium ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {isWinner ? t('victory') : t('defeat')}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('date')}</div>
                                <div className="text-gray-800 dark:text-gray-200">{matchDate}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('duration')}</div>
                                <div className="text-gray-800 dark:text-gray-200">{formatDuration(match.duration || 0)}</div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('match_id')}</div>
                                <div className="text-gray-800 dark:text-gray-200 text-xs truncate" title={match.matchId || match.id}>
                                  {(match.matchId || match.id || "").substring(0, 10)}...
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Game details if available */}
                        {match.gameDetails && (
                          <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('battle_notes')}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{match.gameDetails}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block w-20 h-20 mb-4 opacity-50">
              <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-300 dark:text-gray-600">
                <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                  <rect width="36" height="36" fill="#FFFFFF" rx="72"></rect>
                </mask>
                <g mask="url(#mask__beam)">
                  <rect width="36" height="36" fill="#ccd1d7"></rect>
                  <rect x="0" y="0" width="36" height="36" transform="translate(9 -5) rotate(219 18 18) scale(1)" fill="#879cac" rx="6"></rect>
                  <g transform="translate(4.5 -4) rotate(9 18 18)">
                    <path d="M15 19c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round"></path>
                    <rect x="10" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                    <rect x="24" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                  </g>
                </g>
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? t('no_matches_found_for_search') : filterStatus !== 'all' ? 
                (filterStatus === 'wins' ? t('no_victories_found') : t('no_defeats_found')) : 
                t('no_matches_found')}
            </p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              {searchTerm ? t('try_different_search') : t('start_battling')}
            </p>
          </div>
        )}
        
        {/* Load more / Show all button */}
        {expandable && !showAll && getFilteredAndSortedMatches().length > pageSize && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('loading')}...
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  {t('show_all_matches')} ({getFilteredAndSortedMatches().length})
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Show less button when all matches are showing */}
        {showAll && getFilteredAndSortedMatches().length > pageSize && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              {t('show_less')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}