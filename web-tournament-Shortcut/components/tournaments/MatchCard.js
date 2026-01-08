// components/tournament/MatchCard.js
import React, { useState } from 'react';
import Image from 'next/image';
import { Trophy, Clock, AlertTriangle, User, Edit, CheckCircle, Award, Shield } from 'lucide-react';
import Link from 'next/link';

export default function MatchCard({ match, userMap, isAdmin = false, isParticipant = false, currentUserId }) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [scores, setScores] = useState({
    player1: match.scores?.player1 || 0,
    player2: match.scores?.player2 || 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const player1 = match.player1 ? userMap[match.player1] : null;
  const player2 = match.player2 ? userMap[match.player2] : null;
  const isParticipantMatch = match.player1 === currentUserId || match.player2 === currentUserId;
  
  // Determine if the user can report scores
  const canReportScores = isParticipantMatch && match.status === 'in_progress';
  
  // Card status styling
  const getStatusColor = () => {
    switch (match.status) {
      case 'pending': return 'border-gray-200 dark:border-gray-700';
      case 'in_progress': return 'border-blue-200 dark:border-blue-800';
      case 'completed': return 'border-green-200 dark:border-green-800';
      case 'cancelled': return 'border-red-200 dark:border-red-800';
      default: return 'border-gray-200 dark:border-gray-700';
    }
  };
  
  // Card background styling
  const getStatusBg = () => {
    switch (match.status) {
      case 'pending': return 'bg-white dark:bg-gray-800';
      case 'in_progress': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'completed': return 'bg-green-50 dark:bg-green-900/20';
      case 'cancelled': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-white dark:bg-gray-800';
    }
  };
  
  // Status indicator text
  const getStatusText = () => {
    switch (match.status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };
  
  // Get status icon
  const getStatusIcon = () => {
    switch (match.status) {
      case 'pending': return <Clock className="h-4 w-4 mr-1" />;
      case 'in_progress': return <AlertTriangle className="h-4 w-4 mr-1" />;
      case 'completed': return <Trophy className="h-4 w-4 mr-1" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 mr-1" />;
      default: return <Clock className="h-4 w-4 mr-1" />;
    }
  };
  
  // Handle score update
  const handleScoreUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/tournaments/${match.tournamentId}/matches/${match.matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scores: {
            player1: parseInt(scores.player1),
            player2: parseInt(scores.player2)
          },
          reportedBy: currentUserId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowUpdateForm(false);
        window.location.reload(); // Reload to show updated bracket
      } else {
        setError(data.error || 'Erreur lors de la mise à jour du match');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      setError('Erreur lors de la mise à jour du match');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setScores({ ...scores, [name]: value });
  };
  
  return (
    <div className={`w-60 rounded-lg shadow-md ${getStatusBg()} border ${getStatusColor()} transition-all hover:shadow-lg`}>
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        <div className="flex space-x-1">
          {isAdmin && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canReportScores && !showUpdateForm && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              Signaler score
            </button>
          )}
        </div>
      </div>
      
      {/* Player 1 */}
      <div className={`p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${
        match.winner === match.player1 ? 'bg-green-50 dark:bg-green-900/30' : ''
      }`}>
        <div className="flex items-center">
          {player1 ? (
            <>
              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-gray-200 dark:border-gray-700">
                <Image 
                  src={player1.avatar || '/images/default-avatar.png'} 
                  alt={player1.pseudo} 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <Link href={`/profile/${player1.iduser}`}>
                  <span className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[120px] inline-block">
                    {player1.pseudo}
                  </span>
                </Link>
                
                {match.status === 'completed' && (
                  <div className="flex items-center mt-1">
                    {match.winner === match.player1 ? (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                        <Award className="h-3 w-3 mr-1" /> V
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                        <Shield className="h-3 w-3 mr-1" /> D
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">TBD</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {match.status === 'completed' && (
            <span className="text-lg font-bold mr-2 bg-white/90 dark:bg-black/20 w-8 h-8 flex items-center justify-center rounded-full shadow">
              {match.scores?.player1 || '0'}
            </span>
          )}
          {match.winner === match.player1 && (
            <Trophy className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>
      
      {/* Player 2 */}
      <div className={`p-3 flex items-center justify-between ${
        match.winner === match.player2 ? 'bg-green-50 dark:bg-green-900/30' : ''
      }`}>
        <div className="flex items-center">
          {player2 ? (
            <>
              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-gray-200 dark:border-gray-700">
                <Image 
                  src={player2.avatar || '/images/default-avatar.png'} 
                  alt={player2.pseudo} 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <Link href={`/profile/${player2.iduser}`}>
                  <span className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[120px] inline-block">
                    {player2.pseudo}
                  </span>
                </Link>
                
                {match.status === 'completed' && (
                  <div className="flex items-center mt-1">
                    {match.winner === match.player2 ? (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                        <Award className="h-3 w-3 mr-1" /> V
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                        <Shield className="h-3 w-3 mr-1" /> D
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">TBD</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {match.status === 'completed' && (
            <span className="text-lg font-bold mr-2 bg-white/90 dark:bg-black/20 w-8 h-8 flex items-center justify-center rounded-full shadow">
              {match.scores?.player2 || '0'}
            </span>
          )}
          {match.winner === match.player2 && (
            <Trophy className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>
      
      {/* Score Update Form */}
      {showUpdateForm && (player1 || player2) && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <form onSubmit={handleScoreUpdate}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Score</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  name="player1"
                  min="0"
                  max="99"
                  value={scores.player1}
                  onChange={handleInputChange}
                  className="w-12 h-8 text-center border border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="number"
                  name="player2"
                  min="0"
                  max="99"
                  value={scores.player2}
                  onChange={handleInputChange}
                  className="w-12 h-8 text-center border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
            </div>
            
            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                {error}
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setShowUpdateForm(false)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
              >
                {loading ? (
                  <span className="animate-spin inline-block h-3 w-3 mr-1 border-t-2 border-white rounded-full"></span>
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}