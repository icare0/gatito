import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export default function Search() {
  const router = useRouter();
  const { q } = router.query;
  const { t } = useTranslation(['common', 'search']);
  
  const [searchResults, setSearchResults] = useState({ clans: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    if (!q) return;
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        const [clansRes, usersRes] = await Promise.all([
          fetch(`/api/clans/search?q=${encodeURIComponent(q)}`),
          fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        ]);
        
        const clansData = await clansRes.json();
        const usersData = await usersRes.json();
        
        setSearchResults({
          clans: clansData.success ? clansData.clans : [],
          users: usersData.success ? usersData.users : []
        });
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [q]);
  
  const displayResults = activeTab === 'all' 
    ? [...searchResults.clans, ...searchResults.users]
    : activeTab === 'clans' 
      ? searchResults.clans 
      : searchResults.users;
  
  return (
    <Layout title={`${t('search:search')}: ${q || ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <h1 className="text-3xl font-bold mb-2">{t('search:search_results')}</h1>
            <p className="text-blue-100">
              {t('search:search_for')}: <span className="font-semibold">"{q}"</span>
            </p>
          </div>
          
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex p-4">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full font-medium ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('search:all')} ({searchResults.clans.length + searchResults.users.length})
              </button>
              <button 
                onClick={() => setActiveTab('clans')}
                className={`px-4 py-2 rounded-full font-medium ml-2 ${
                  activeTab === 'clans'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('search:clans')} ({searchResults.clans.length})
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-full font-medium ml-2 ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('search:players')} ({searchResults.users.length})
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">{t('search:searching')}...</p>
              </div>
            ) : displayResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayResults.map(result => {
                  // Détecter si c'est un clan ou un joueur
                  const isClan = 'idClan' in result;
                  
                  if (isClan) {
                    return (
                      <Link href={`/clan/${result.idClan}`} key={`clan-${result.idClan}`}>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                              <Image 
                                src={result.profilepicture || '/images/default-clan.png'} 
                                alt={`${result.Name} logo`}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-900">{result.Name}</h3>
                                  <p className="text-xs text-gray-500">{t('search:clan')} • ELO: {result.elo}</p>
                                </div>
                                {result.isQualified && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    {t('search:qualified')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  } else {
                    return (
                      <Link href={`/profile/${result.iduser}`} key={`user-${result.iduser}`}>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                              <Image 
                                src={result.avatar || '/images/default-avatar.png'} 
                                alt={`${result.pseudo} avatar`}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-900">{result.pseudo}</h3>
                                  <p className="text-xs text-gray-500">{t('search:player')} • ELO: {result.elo}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  result.rank === 'diamond' ? 'bg-cyan-100 text-cyan-800' :
                                  result.rank === 'platinum' ? 'bg-indigo-100 text-indigo-800' :
                                  result.rank === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                                  result.rank === 'silver' ? 'bg-gray-100 text-gray-800' :
                                  result.rank === 'bronze' ? 'bg-amber-100 text-amber-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {result.rank?.toUpperCase() || 'UNRANKED'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">{t('search:no_results')} "{q}".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'search'])),
    },
  };
}