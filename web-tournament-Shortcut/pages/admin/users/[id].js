// pages/admin/users/[id].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Image from 'next/image';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Save, ArrowLeft, RefreshCw, Shield, Award, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditUser() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    pseudo: '',
    email: '',
    role: '',
    elo: 1000,
    rank: 'unranked',
    codeAmis: '',
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${id}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          // Initialize form with user data
          setFormData({
            pseudo: data.user.pseudo || '',
            email: data.user.email || '',
            role: data.user.role || 'user',
            elo: data.user.elo || 1000,
            rank: data.user.rank || 'unranked',
            codeAmis: data.user.codeAmis || '',
          });
        } else {
          setStatusMessage({ type: 'error', message: data.error || 'Failed to fetch user' });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setStatusMessage({ type: 'error', message: 'Error fetching user data' });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to numbers
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ type: '', message: '' });

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setStatusMessage({ type: 'success', message: 'User updated successfully' });
        // Update local user data
        setUser({ ...user, ...formData });
      } else {
        setStatusMessage({ type: 'error', message: data.error || 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setStatusMessage({ type: 'error', message: 'Error updating user' });
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <AdminLayout title="Chargement de l'utilisateur...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user && !loading) {
    return (
      <AdminLayout title="Utilisateur non trouvé">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Utilisateur non trouvé</h2>
            <p className="text-gray-600 mb-4">L'utilisateur que vous recherchez n'existe pas ou a été supprimé.</p>
            <Link href="/admin/users">
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste des utilisateurs
              </a>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Éditer ${user.pseudo}`}>
      <div className="mb-6">
        <Link href="/admin/users">
          <a className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour à la liste des utilisateurs
          </a>
        </Link>
      </div>

      {statusMessage.message && (
        <div className={`mb-6 p-4 rounded-md ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 bg-white rounded-full overflow-hidden border-2 border-white mr-4">
                <Image 
                  src={user.avatar || '/images/default-avatar.png'} 
                  alt={`${user.pseudo}'s avatar`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.pseudo}</h1>
                <p className="text-blue-200">Discord ID: {user.iduser}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-700 text-white">
                <Award className="h-4 w-4 mr-1" />
                {user.rank?.toUpperCase() || 'UNRANKED'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-700 text-white">
                <Shield className="h-4 w-4 mr-1" />
                {user.role?.toUpperCase() || 'USER'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-1">
                Pseudo
              </label>
              <input
                type="text"
                name="pseudo"
                id="pseudo"
                value={formData.pseudo}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <select
                name="role"
                id="role"
                value={formData.role}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="user">Utilisateur</option>
                <option value="moderator">Modérateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <label htmlFor="elo" className="block text-sm font-medium text-gray-700 mb-1">
                ELO
              </label>
              <input
                type="number"
                name="elo"
                id="elo"
                min="0"
                max="9999"
                value={formData.elo}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1">
                Rang
              </label>
              <select
                name="rank"
                id="rank"
                value={formData.rank}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="unranked">Non classé</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>

            <div>
              <label htmlFor="codeAmis" className="block text-sm font-medium text-gray-700 mb-1">
                Code Ami
              </label>
              <input
                type="text"
                name="codeAmis"
                id="codeAmis"
                placeholder="SW-XXXX-XXXX-XXXX"
                value={formData.codeAmis}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Informations supplémentaires</h2>
        </div>

        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Date d'inscription</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Dernière mise à jour</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Matchs totaux</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.totalMatches || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Victoires</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.victories || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Winrate</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.winRate ? `${user.winRate.toFixed(1)}%` : '0%'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Meilleure série</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.longestWinStreak || 0}</dd>
            </div>
          </dl>
        </div>
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