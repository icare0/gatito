// pages/admin/tournaments/index.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  Trophy, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import LoadingScreen from '../../../components/shared/LoadingScreen';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { connectToDatabase } from '../../../lib/mongodb';

export default function AdminTournamentsPage({ initialTournaments = [] }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Check if user is authenticated and is admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && !session.user.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);
  
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
  
  // Delete tournament
  const deleteTournament = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the tournament from the state
        setTournaments(tournaments.filter(t => t._id !== id));
      } else {
        alert(data.error || 'Erreur lors de la suppression du tournoi');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Erreur serveur lors de la suppression du tournoi');
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };
  
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
          label: 'Brouillon',
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
  
  // Show loading screen while checking authentication
  if (status === 'loading' || (status === 'authenticated' && !session.user.isAdmin)) {
    return <LoadingScreen />;
  }
  
  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return null; // Will redirect to sign in
  }
  
  return (
    <AdminLayout title="Gestion des tournois">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-0">
          Gestion des tournois
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
          
          {/* Create Tournament Button */}
          <Link href="/admin/tournaments/create">
            <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Créer un tournoi
            </a>
          </Link>
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
                <option value="draft">Brouillon</option>
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
          {(searchTerm || statusFilter !== 'all') ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Réinitialiser les filtres
            </button>
          ) : (
            <Link href="/admin/tournaments/create">
              <a className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md inline-flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Créer un tournoi
              </a>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tournoi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Format
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Participants
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tournaments.map((tournament) => {
                  const status = getStatusLabel(tournament.status);
                  return (
                    <tr key={tournament._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {tournament.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {tournament.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          Début: {formatDate(tournament.startDate)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Fin: {formatDate(tournament.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {tournament.format === 'single_elimination' ? 'Élimination directe' :
                           tournament.format === 'double_elimination' ? 'Double élimination' :
                           tournament.format === 'round_robin' ? 'Poules' :
                           tournament.format === 'swiss' ? 'Système suisse' : 'Format inconnu'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {tournament.participants?.length || 0} participants
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.bgColor} ${status.textColor}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/tournaments/${tournament._id}`}>
                            <a className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              Voir
                            </a>
                          </Link>
                          <Link href={`/admin/tournaments/${tournament._id}`}>
                            <a className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              Éditer
                            </a>
                          </Link>
                          {confirmDelete === tournament._id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => deleteTournament(tournament._id)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                              >
                                {loading ? 'Suppression...' : 'Confirmer'}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(tournament._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all tournaments
    const tournaments = await db.collection('tournaments')
      .find({})
      .sort({ createdAt: -1 })
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