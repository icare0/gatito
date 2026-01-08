// pages/tournaments/index.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { connectToDatabase } from '../../lib/mongodb';
import { 
  Calendar, 
  Trophy, 
  Users, 
  Search, 
  Filter,
  ChevronDown,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function TournamentsPage({ initialTournaments = [] }) {
  const { t } = useTranslation('common');
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      // If search is empty, reset to initial tournaments
      setTournaments(initialTournaments);
      return;
    }
    
    // Filter tournaments by name on client-side
    const filteredTournaments = initialTournaments.filter(tournament => 
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setTournaments(filteredTournaments);
  };
  
  // Handle status filter change
  useEffect(() => {
    if (statusFilter === 'all') {
      // If filter is 'all', show all tournaments
      setTournaments(initialTournaments);
      return;
    }
    
    // Filter tournaments by status
    const filteredTournaments = initialTournaments.filter(tournament => 
      tournament.status === statusFilter
    );
    
    setTournaments(filteredTournaments);
  }, [statusFilter, initialTournaments]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Get status label and color
  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return {
          label: 'En préparation',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          textColor: 'text-gray-800 dark:text-gray-200'
        };
      case 'registration':
        return {
          label: 'Inscriptions ouvertes',
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          textColor: 'text-blue-800 dark:text-blue-200'
        };
      case 'ongoing':
        return {
          label: 'En cours',
          bgColor: 'bg-green-100 dark:bg-green-900',
          textColor: 'text-green-800 dark:text-green-200'
        };
      case 'completed':
        return {
          label: 'Terminé',
          bgColor: 'bg-purple-100 dark:bg-purple-900',
          textColor: 'text-purple-800 dark:text-purple-200'
        };
      default:
        return {
          label: 'Inconnu',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          textColor: 'text-gray-800 dark:text-gray-200'
        };
    }
  };
  
  return (
    <Layout title="Tournois">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-0">
            Tournois
          </h1>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex">
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un tournoi..."
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-4 py-2 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <button
                type="submit"
                className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Rechercher
              </button>
            </form>
            
            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="registration">Inscriptions ouvertes</option>
                  <option value="ongoing">En cours</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>
              {/* Add more filters here if needed */}
            </div>
          </div>
        )}
        
        {tournaments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Aucun tournoi trouvé</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? "Aucun tournoi ne correspond à votre recherche." 
                : statusFilter !== 'all' 
                  ? `Aucun tournoi avec le statut "${getStatusLabel(statusFilter).label}" n'est disponible.` 
                  : "Aucun tournoi n'est disponible pour le moment."}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => {
              const status = getStatusLabel(tournament.status);
              return (
                <Link href={`/tournaments/${tournament._id}`} key={tournament._id}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                    {/* Tournament Banner */}
                    <div className="h-40 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
                      {tournament.banner && (
                        <Image
                          src={tournament.banner}
                          alt={tournament.name}
                          layout="fill"
                          objectFit="cover"
                          className="opacity-70"
                        />
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.textColor}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 right-0">
                        <h2 className="text-xl font-bold text-white truncate">{tournament.name}</h2>
                      </div>
                    </div>
                    
                    {/* Tournament Details */}
                    <div className="p-4 flex-grow">
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">{tournament.description}</p>
                      
                      <div className="space-y-2">
                        
                       
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                          <span>
                            {tournament.participants?.length || 0} participants
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all accessible tournaments (not drafts)
    const tournaments = await db.collection('tournaments')
      .find({ status: { $ne: 'draft' } })
      .sort({ startDate: -1 })
      .toArray();
    
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialTournaments: JSON.parse(JSON.stringify(tournaments))
      }
    };
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialTournaments: []
      }
    };
  }
}