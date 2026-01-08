// pages/admin/users/index.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import Image from 'next/image';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Search, Filter, ChevronDown, ChevronUp, UserPlus, RefreshCw } from 'lucide-react';

export default function AdminUsers() {
  const { data: session } = useSession();
  const { t } = useTranslation(['common', 'admin']);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterRank, setFilterRank] = useState('all');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 20;

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users?limit=${limit}&sort=${sortConfig.key}&direction=${sortConfig.direction}&search=${searchTerm}&page=${page}`
      );
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setTotalUsers(data.total || data.users.length);
      } else {
        console.error('Error fetching users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [sortConfig, searchTerm, page]);

  // Apply client-side filters
  const filteredUsers = users.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterRank !== 'all' && user.rank !== filterRank) return false;
    return true;
  });

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(user => 
          user.iduser === userId ? { ...user, role: newRole } : user
        ));
      } else {
        console.error('Error updating user role:', data.error);
        alert(data.error || 'Erreur lors de la mise à jour du rôle');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchUsers();
  };

  // Get rank color classes
  const getRankClasses = (rank) => {
    const classes = {
      diamond: 'bg-cyan-100 text-cyan-800',
      platinum: 'bg-indigo-100 text-indigo-800',
      gold: 'bg-yellow-100 text-yellow-800',
      silver: 'bg-gray-100 text-gray-800',
      bronze: 'bg-amber-100 text-amber-800',
      unranked: 'bg-gray-100 text-gray-500'
    };
    return classes[rank] || classes.unranked;
  };

  // Get role color classes
  const getRoleClasses = (role) => {
    const classes = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800'
    };
    return classes[role] || classes.user;
  };

  return (
    <AdminLayout title="Gestion des Utilisateurs">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header with search and filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <h2 className="text-xl font-bold text-gray-800">
              {totalUsers} Utilisateurs
            </h2>
            
            {/* Search form */}
            <form onSubmit={handleSearch} className="flex">
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 sm:text-sm border-gray-300 rounded-md"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <button
                type="submit"
                className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Rechercher
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </button>
              <button
                type="button"
                onClick={fetchUsers}
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </form>
          </div>
          
          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700">
                    Rôle
                  </label>
                  <select
                    id="roleFilter"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Modérateur</option>
                    <option value="user">Utilisateur</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rankFilter" className="block text-sm font-medium text-gray-700">
                    Rang
                  </label>
                  <select
                    id="rankFilter"
                    value={filterRank}
                    onChange={(e) => setFilterRank(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Tous les rangs</option>
                    <option value="diamond">Diamond</option>
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                    <option value="unranked">Non classé</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Users table */}
        <div className="overflow-x-auto">
          {loading && users.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('elo')}
                  >
                    <div className="flex items-center">
                      ELO
                      {sortConfig.key === 'elo' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rang
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Inscrit le
                      {sortConfig.key === 'createdAt' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.iduser} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <Image 
                            src={user.avatar || '/images/default-avatar.png'} 
                            alt={`${user.pseudo} avatar`}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.pseudo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email || 'Pas d\'email'} • ID: {user.iduser.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{user.elo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRankClasses(user.rank)}`}>
                        {user.rank?.toUpperCase() || 'NON CLASSÉ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.clanName ? (
                        <Link href={`/clan/${user.clanId}`}>
                          <span className="text-blue-600 hover:text-blue-800">
                            {user.clanName} ({user.clanRole})
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={user.role || 'user'} 
                        onChange={(e) => handleRoleChange(user.iduser, e.target.value)}
                        className={`text-xs rounded-full py-1 px-2 border-0 ${getRoleClasses(user.role)}`}
                        disabled={session?.user?.id === user.iduser} // Prevent changing own role
                      >
                        <option value="user">Utilisateur</option>
                        <option value="moderator">Modérateur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link href={`/profile/${user.iduser}`}>
                          <span className="text-indigo-600 hover:text-indigo-900">
                            Voir
                          </span>
                        </Link>
                        <Link href={`/admin/users/${user.iduser}`}>
                          <span className="text-blue-600 hover:text-blue-900">
                            Éditer
                          </span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalUsers > limit && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, totalUsers)} sur {totalUsers} utilisateurs
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= totalUsers}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'admin'])),
    },
  };
}