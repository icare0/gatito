// pages/admin/tournaments/create.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { 
  Save, 
  ArrowLeft, 
  RefreshCw, 
  Calendar, 
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';
import LoadingScreen from '../../../components/shared/LoadingScreen';

export default function AdminCreateTournament() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationEndDate: '',
    status: 'draft',
    format: 'single_elimination',
    rules: '',
  });
  
  const [roundFormats, setRoundFormats] = useState([
    { round: 1, format: 'bo1' }
  ]);
  
  const [prizes, setPrizes] = useState([
    { place: 1, description: 'Prix du vainqueur' }
  ]);
  
  // Check if user is authenticated and is admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && !session.user.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle round format change
  const handleRoundFormatChange = (index, field, value) => {
    const newFormats = [...roundFormats];
    newFormats[index] = { ...newFormats[index], [field]: value };
    setRoundFormats(newFormats);
  };
  
  // Add round format
  const addRoundFormat = () => {
    const nextRound = roundFormats.length + 1;
    setRoundFormats([...roundFormats, { round: nextRound, format: 'bo1' }]);
  };
  
  // Remove round format
  const removeRoundFormat = (index) => {
    if (roundFormats.length <= 1) return;
    const newFormats = roundFormats.filter((_, i) => i !== index);
    // Renumber the rounds
    const updatedFormats = newFormats.map((format, i) => ({ ...format, round: i + 1 }));
    setRoundFormats(updatedFormats);
  };
  
  // Handle prize change
  const handlePrizeChange = (index, field, value) => {
    const newPrizes = [...prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setPrizes(newPrizes);
  };
  
  // Add prize
  const addPrize = () => {
    const nextPlace = prizes.length + 1;
    setPrizes([...prizes, { place: nextPlace, description: '' }]);
  };
  
  // Remove prize
  const removePrize = (index) => {
    if (prizes.length <= 1) return;
    const newPrizes = prizes.filter((_, i) => i !== index);
    // Renumber the places
    const updatedPrizes = newPrizes.map((prize, i) => ({ ...prize, place: i + 1 }));
    setPrizes(updatedPrizes);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          roundFormats,
          prizes,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Tournoi créé avec succès', type: 'success' });
        // Redirect to the tournament edit page
        setTimeout(() => {
          router.push(`/admin/tournaments/${data.tournament._id}`);
        }, 1500);
      } else {
        setMessage({ text: data.error || 'Erreur lors de la création du tournoi', type: 'error' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      setMessage({ text: 'Erreur serveur lors de la création du tournoi', type: 'error' });
      setLoading(false);
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
    <AdminLayout title="Créer un tournoi">
      <div className="mb-6">
        <Link href="/admin/tournaments">
          <a className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            <ArrowLeft className="h-5 w-5 mr-1" /> Retour aux tournois
          </a>
        </Link>
      </div>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800' 
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h1 className="text-2xl font-bold">Créer un nouveau tournoi</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du tournoi *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début *
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin *
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="registrationEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fin des inscriptions *
              </label>
              <input
                type="datetime-local"
                id="registrationEndDate"
                name="registrationEndDate"
                value={formData.registrationEndDate}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="draft">Brouillon</option>
                <option value="registration">Inscriptions ouvertes</option>
                <option value="ongoing">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format du tournoi *
              </label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="single_elimination">Élimination directe</option>
                <option value="double_elimination">Double élimination</option>
                <option value="round_robin">Tournoi à la ronde (poules)</option>
                <option value="swiss">Système suisse</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="rules" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Règlement (HTML)
            </label>
            <textarea
              id="rules"
              name="rules"
              rows="8"
              value={formData.rules}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
            ></textarea>
          </div>
          
          {/* Round Formats */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Format des rounds</h3>
            <div className="space-y-3">
              {roundFormats.map((format, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Round
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={format.round}
                      onChange={(e) => handleRoundFormatChange(index, 'round', parseInt(e.target.value))}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      readOnly
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Format
                    </label>
                    <select
                      value={format.format}
                      onChange={(e) => handleRoundFormatChange(index, 'format', e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="bo1">Best of 1</option>
                      <option value="bo3">Best of 3</option>
                      <option value="bo5">Best of 5</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <button
                      type="button"
                      onClick={() => removeRoundFormat(index)}
                      disabled={roundFormats.length <= 1}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRoundFormat}
              className="mt-3 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter un round
            </button>
          </div>
          
          {/* Prizes */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Récompenses</h3>
            <div className="space-y-3">
              {prizes.map((prize, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-1/4">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Place
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={prize.place}
                      onChange={(e) => handlePrizeChange(index, 'place', parseInt(e.target.value))}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      readOnly
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={prize.description}
                      onChange={(e) => handlePrizeChange(index, 'description', e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Ex: 100€ en carte cadeau"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <button
                      type="button"
                      onClick={() => removePrize(index)}
                      disabled={prizes.length <= 1}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPrize}
              className="mt-3 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter une récompense
            </button>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer le tournoi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}