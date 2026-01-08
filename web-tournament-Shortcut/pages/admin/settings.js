// pages/admin/settings/index.js
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { 
  Settings as SettingsIcon, 
  Calendar, 
  Users, 
  Clock,
  Award as AwardIcon, // Correctly import Award icon
  DollarSign,
  Server,
  Shield
} from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ saving: false, success: false, error: null });
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        if (data.success) {
          setSettings(data.settings);
        } else {
          console.error('Error fetching settings:', data.error);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (section, data) => {
    setSaveStatus({ saving: true, success: false, error: null });
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, data }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSaveStatus({ saving: false, success: true, error: null });
        
        // Update local state
        setSettings(result.settings);
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, success: false }));
        }, 3000);
      } else {
        setSaveStatus({ saving: false, success: false, error: result.error });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus({ saving: false, success: false, error: 'Une erreur est survenue lors de la sauvegarde des paramètres' });
    }
  };
  
  // Form components for different sections
  const GeneralSettings = () => {
    const [formData, setFormData] = useState({
      siteName: settings?.siteName || 'Pocketex',
      siteDescription: settings?.siteDescription || '',
      maintenanceMode: settings?.maintenanceMode || false,
      registrationEnabled: settings?.registrationEnabled || true,
    });
    
    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    };
    
    const handleSave = (e) => {
      e.preventDefault();
      handleSubmit('general', formData);
    };
    
    return (
      <form onSubmit={handleSave}>
        <div className="space-y-6">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
              Nom du site
            </label>
            <input
              type="text"
              name="siteName"
              id="siteName"
              value={formData.siteName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
              Description du site
            </label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              rows="3"
              value={formData.siteDescription}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="maintenanceMode"
                name="maintenanceMode"
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={handleChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="maintenanceMode" className="font-medium text-gray-700">Mode maintenance</label>
              <p className="text-gray-500">Rendre le site inaccessible aux utilisateurs non administrateurs</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="registrationEnabled"
                name="registrationEnabled"
                type="checkbox"
                checked={formData.registrationEnabled}
                onChange={handleChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="registrationEnabled" className="font-medium text-gray-700">Inscriptions activées</label>
              <p className="text-gray-500">Autoriser l'inscription de nouveaux utilisateurs</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={saveStatus.saving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {saveStatus.saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    );
  };
  
  const SeasonSettings = () => {
    const [formData, setFormData] = useState({
      number: settings?.currentSeason?.number || '1',
      startDate: settings?.currentSeason?.startDate 
        ? new Date(settings.currentSeason.startDate).toISOString().split('T')[0] 
        : '',
      endDate: settings?.currentSeason?.endDate 
        ? new Date(settings.currentSeason.endDate).toISOString().split('T')[0] 
        : '',
    });
    
    useEffect(() => {
      // Update form when settings change
      if (settings?.currentSeason) {
        setFormData({
          number: settings.currentSeason.number || '1',
          startDate: settings.currentSeason.startDate 
            ? new Date(settings.currentSeason.startDate).toISOString().split('T')[0] 
            : '',
          endDate: settings.currentSeason.endDate 
            ? new Date(settings.currentSeason.endDate).toISOString().split('T')[0] 
            : '',
        });
      }
    }, [settings]);
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value,
      });
    };
    
    const handleSave = (e) => {
      e.preventDefault();
      // For debugging
      console.log('Saving season settings:', formData);
      handleSubmit('currentSeason', formData);
    };
    
    return (
      <form onSubmit={handleSave}>
        <div className="space-y-6">
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700">
              Numéro de saison
            </label>
            <input
              type="text"
              name="number"
              id="number"
              value={formData.number}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Date de début
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Date de fin
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={saveStatus.saving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {saveStatus.saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    );
  };
  
  // Render the component
  return (
    <AdminLayout title="Paramètres du site">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Paramètres du site
          </h2>
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Chargement des paramètres...</p>
          </div>
        ) : (
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 p-6 border-r border-gray-200">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'general' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Général
                </button>
                <button
                  onClick={() => setActiveTab('season')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'season' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Saison
                </button>
                <button
                  onClick={() => setActiveTab('matchmaking')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'matchmaking' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Matchmaking
                </button>
                <button
                  onClick={() => setActiveTab('ranks')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'ranks' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <AwardIcon className="h-5 w-5 mr-2" />
                  Rangs
                </button>
                <button
                  onClick={() => setActiveTab('tournament')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'tournament' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Tournoi
                </button>
                <button
                  onClick={() => setActiveTab('discord')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'discord' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Server className="h-5 w-5 mr-2" />
                  Discord
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'security' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Sécurité
                </button>
              </nav>
            </div>
            
            {/* Content area */}
            <div className="flex-1 p-6">
              {/* Status messages */}
              {saveStatus.success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  Paramètres enregistrés avec succès.
                </div>
              )}
              
              {saveStatus.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {saveStatus.error}
                </div>
              )}
              
              {/* Tab content */}
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'season' && <SeasonSettings />}
              {activeTab === 'matchmaking' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-700">Les paramètres de matchmaking seront disponibles prochainement.</p>
                </div>
              )}
              {activeTab === 'ranks' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-700">Les paramètres de rangs seront disponibles prochainement.</p>
                </div>
              )}
              {activeTab === 'tournament' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-700">Les paramètres de tournoi seront disponibles prochainement.</p>
                </div>
              )}
              {activeTab === 'discord' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-700">Les paramètres d'intégration Discord seront disponibles prochainement.</p>
                </div>
              )}
              {activeTab === 'security' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-700">Les paramètres de sécurité seront disponibles prochainement.</p>
                </div>
              )}
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