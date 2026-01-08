// pages/profile/[id].js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { getUserById, getMatchesByUserId } from '../../lib/db';
import { Edit2, Save, X } from 'lucide-react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import MatchHistory from '../../components/profile/MatchHistory';
import PlayerStats from '../../components/profile/PlayerStats';

export default function UserProfile({ user, initialMatches }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    pseudo: user?.pseudo || '',
    codeAmis: user?.codeAmis || '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { t } = useTranslation(['common', 'profile']);
  
  // Check if the profile belongs to the logged-in user
  useEffect(() => {
    if (session && user && session.user.id === user.iduser) {
      setIsOwnProfile(true);
    }
  }, [session, user]);
  
  const rankColors = {
    diamond: 'text-cyan-500',
    platinum: 'text-indigo-400',
    gold: 'text-yellow-500',
    silver: 'text-gray-400',
    bronze: 'text-amber-700',
    unranked: 'text-gray-600',
  };

  const rankBgColors = {
    diamond: 'bg-cyan-100',
    platinum: 'bg-indigo-100',
    gold: 'bg-yellow-100',
    silver: 'bg-gray-100',
    bronze: 'bg-amber-100',
    unranked: 'bg-gray-100',
  };
  
  const rankGradients = {
    diamond: 'from-cyan-500 to-blue-600',
    platinum: 'from-indigo-400 to-purple-600',
    gold: 'from-yellow-400 to-orange-500',
    silver: 'from-gray-400 to-gray-600',
    bronze: 'from-amber-500 to-amber-700',
    unranked: 'from-gray-400 to-gray-600',
  };
  
  if (!user) {
    return (
      <Layout title={t('profile:profile_not_found')}>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 p-4 rounded-lg">
            <p className="text-red-700">{t('profile:profile_not_found')}. {t('profile:check_id')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle editing profile
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser({
      pseudo: user.pseudo || '',
      codeAmis: user.codeAmis || '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };
  
  const handleSaveProfile = async () => {
    try {
      // Validate input
      if (!editedUser.pseudo.trim()) {
        setErrorMessage('Le pseudo ne peut pas être vide');
        return;
      }
      
      // Save changes to the API
      const response = await fetch(`/api/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.iduser,
          updates: {
            pseudo: editedUser.pseudo,
            codeAmis: editedUser.codeAmis,
            pseudoCustomized: true,
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Profil mis à jour avec succès!');
        // Update the UI with new data
        user.pseudo = editedUser.pseudo;
        user.codeAmis = editedUser.codeAmis;
        
        // Exit editing mode
        setTimeout(() => {
          setIsEditing(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(data.error || 'Une erreur est survenue lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Une erreur est survenue lors de la mise à jour');
    }
  };
  
  return (
    <Layout title={user.pseudo || t('common:my_profile')}>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <div className={`h-24 bg-gradient-to-r ${rankGradients[user.rank] || rankGradients.unranked}`}></div>
          <div className="p-6 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              {/* Avatar with Rank Badge */}
              <div className="absolute -top-12 md:-top-12 left-6 md:left-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-700">
                    <Image 
                      src={user.avatar || '/images/default-avatar.png'} 
                      alt={`${user.pseudo} avatar`} 
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${rankBgColors[user.rank] || rankBgColors.unranked} border-2 border-white dark:border-gray-700 rounded-full flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${rankColors[user.rank] || rankColors.unranked}`}>
                      {user.rank ? user.rank.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* User Info */}
              <div className="mt-14 md:mt-0 md:ml-28 flex-grow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    {isEditing ? (
                      <div className="mb-2">
                        <label htmlFor="pseudo" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Pseudo</label>
                        <input
                          id="pseudo"
                          name="pseudo"
                          type="text"
                          value={editedUser.pseudo}
                          onChange={handleInputChange}
                          className="w-full md:w-64 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          maxLength={20}
                        />
                      </div>
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{user.pseudo}</h1>
                    )}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-4">ELO: <strong>{user.elo}</strong></span>
                      <span className={`px-2 py-0.5 rounded-full ${rankBgColors[user.rank] || rankBgColors.unranked} ${rankColors[user.rank] || rankColors.unranked} font-medium`}>
                        {user.rank?.toUpperCase() || 'UNRANKED'}
                      </span>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <div className="mt-4 md:mt-0">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveProfile}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Save size={16} className="mr-1" /> {t('profile:save')}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <X size={16} className="mr-1" /> {t('profile:cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleEditProfile}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Edit2 size={16} className="mr-1" /> {t('profile:edit_profile')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Status Messages */}
                {successMessage && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                  </div>
                )}
                
                {isEditing && (
                  <div className="mt-4">
                    <label htmlFor="codeAmis" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('profile:friend_code')}</label>
                    <input
                      id="codeAmis"
                      name="codeAmis"
                      type="text"
                      value={editedUser.codeAmis}
                      onChange={handleInputChange}
                      placeholder="SW-XXXX-XXXX-XXXX"
                      className="w-full md:w-64 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {isEditing ? (
                    <div className="text-xs italic">{t('profile:member_since')} {new Date(user.createdAt).toLocaleDateString()}</div>
                  ) : (
                    <>
                      {t('profile:member_since')} {new Date(user.createdAt).toLocaleDateString()}
                      {user.codeAmis && (
                        <span className="ml-4 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                          {t('profile:friend_code')}: {user.codeAmis}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'overview' 
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('profile:statistics')}
            </button>
            <button 
              onClick={() => setActiveTab('matches')}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'matches' 
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('profile:match_history')}
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <PlayerStats user={user} matchHistory={initialMatches} />
        )}
        
        {activeTab === 'matches' && (
          <MatchHistory 
            userId={user.iduser}
            initialMatches={initialMatches}
            expandable={true}
          />
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params, locale }) {
  try {
    const user = await getUserById(params.id);
    
    // Get a good number of initial matches for the page load
    // The components will fetch more if needed
    const recentMatches = await getMatchesByUserId(params.id, -1);
    
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common', 'profile'])),
        user: JSON.parse(JSON.stringify(user)),
        initialMatches: JSON.parse(JSON.stringify(recentMatches))
      }
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common', 'profile'])),
        user: null,
        initialMatches: []
      }
    };
  }
}