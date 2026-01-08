// components/admin/ParticipantManager.js
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, UserPlus, UserMinus, RefreshCw, XCircle } from 'lucide-react';

export default function ParticipantManager({ tournamentId, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentParticipants, setCurrentParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfirmRemove, setShowConfirmRemove] = useState(null);

  // Fetch current participants
  useEffect(() => {
    fetchParticipants();
  }, [tournamentId]);

  const fetchParticipants = async () => {
    if (!tournamentId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/participants`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentParticipants(data.participants);
      } else {
        setMessage({ text: data.error || 'Erreur lors de la récupération des participants', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      setMessage({ text: 'Erreur serveur lors de la récupération des participants', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const searchUsers = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter out users who are already participants
        const filteredResults = data.users.filter(
          user => !currentParticipants.some(p => p.iduser === user.iduser)
        );
        setSearchResults(filteredResults);
      } else {
        setMessage({ text: data.error || 'Erreur lors de la recherche d\'utilisateurs', type: 'error' });
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setMessage({ text: 'Erreur serveur lors de la recherche d\'utilisateurs', type: 'error' });
    } finally {
      setSearchLoading(false);
    }
  };

  // Add participant to tournament
  const addParticipant = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Participant ajouté avec succès', type: 'success' });
        // Remove from search results
        setSearchResults(searchResults.filter(user => user.iduser !== userId));
        // Update participants list
        fetchParticipants();
        // Update parent component
        if (onUpdate) onUpdate();
      } else {
        setMessage({ text: data.error || 'Erreur lors de l\'ajout du participant', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      setMessage({ text: 'Erreur serveur lors de l\'ajout du participant', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Remove participant from tournament
  const removeParticipant = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/participants`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Participant retiré avec succès', type: 'success' });
        // Update participants list
        setCurrentParticipants(currentParticipants.filter(p => p.iduser !== userId));
        // Update parent component
        if (onUpdate) onUpdate();
      } else {
        setMessage({ text: data.error || 'Erreur lors de la suppression du participant', type: 'error' });
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      setMessage({ text: 'Erreur serveur lors de la suppression du participant', type: 'error' });
    } finally {
      setLoading(false);
      setShowConfirmRemove(null);
    }
  };

  return (
    <div>
      {message.text && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800' 
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Search form */}
      <form onSubmit={searchUsers} className="mb-4">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full px-4 py-2 rounded-l-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg disabled:opacity-50"
          >
            {searchLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              'Rechercher'
            )}
          </button>
        </div>
      </form>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Résultats</h3>
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
              {searchResults.map(user => (
                <li key={user.iduser} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 mr-3">
                        <Image
                          src={user.avatar || '/images/default-avatar.png'}
                          alt={user.pseudo}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">{user.pseudo}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ELO: {user.elo || 'N/A'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addParticipant(user.iduser)}
                      disabled={loading}
                      className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Current Participants */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Participants actuels</h3>
        {loading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400">Chargement des participants...</p>
          </div>
        ) : currentParticipants.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-y-auto max-h-96">
            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
              {currentParticipants.map(user => (
                <li key={user.iduser} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 mr-3">
                        <Image
                          src={user.avatar || '/images/default-avatar.png'}
                          alt={user.pseudo}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">{user.pseudo}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                            ELO: {user.elo || 'N/A'}
                          </span>
                          {user.rank && (
                            <span className="text-xs capitalize px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">
                              {user.rank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {showConfirmRemove === user.iduser ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeParticipant(user.iduser)}
                          disabled={loading}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full disabled:opacity-50"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowConfirmRemove(null)}
                          className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 rounded-full"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowConfirmRemove(user.iduser)}
                        className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 rounded-full"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <UserMinus className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400">Aucun participant inscrit</p>
          </div>
        )}
      </div>
    </div>
  );
}