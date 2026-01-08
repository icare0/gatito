// components/admin/TournamentManager.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Save, 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  Calendar, 
  Trophy, 
  Play,
  AlertTriangle,
  Slash,
  CheckCircle,
  Edit,
  Trash2,
  UserPlus,
  UserMinus
} from 'lucide-react';
import ParticipantManager from './ParticipantManager';

export default function TournamentManager({ tournament, onUpdate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showParticipants, setShowParticipants] = useState(false);
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    description: tournament?.description || '',
    startDate: tournament?.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : '',
    endDate: tournament?.endDate ? new Date(tournament.endDate).toISOString().slice(0, 16) : '',
    registrationEndDate: tournament?.registrationEndDate ? new Date(tournament.registrationEndDate).toISOString().slice(0, 16) : '',
    status: tournament?.status || 'draft',
    format: tournament?.format || 'single_elimination',
    rules: tournament?.rules || '',
  });
  
  const [roundFormats, setRoundFormats] = useState(
    tournament?.roundFormats || [
      { round: 1, format: 'bo1' }
    ]
  );
  
  const [prizes, setPrizes] = useState(
    tournament?.prizes || [
      { place: 1, description: 'Prix du vainqueur' }
    ]
  );
  
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
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetch(`/api/tournaments/${tournament._id}`, {
        method: 'PUT',
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
        setMessage({ text: 'Tournoi mis à jour avec succès', type: 'success' });
        if (onUpdate) onUpdate(data.tournament);
      } else {
        setMessage({ text: data.error || 'Erreur lors de la mise à jour du tournoi', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      setMessage({ text: 'Erreur serveur lors de la mise à jour du tournoi', type: 'error' });
    } finally {
      setSaving(false);
    }
  };
  
  // Generate bracket
  const generateBracket = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir générer l\'arbre du tournoi ? Cette action clôturera les inscriptions.')) {
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetch(`/api/tournaments/${tournament._id}/generate-bracket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Arbre du tournoi généré avec succès', type: 'success' });
        if (onUpdate) onUpdate(data.tournament);
      } else {
        setMessage({ text: data.error || 'Erreur lors de la génération de l\'arbre', type: 'error' });
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      setMessage({ text: 'Erreur serveur lors de la génération de l\'arbre', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Start tournament
  const startTournament = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir démarrer le tournoi ?')) {
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetch(`/api/tournaments/${tournament._id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Tournoi démarré avec succès', type: 'success' });
        if (onUpdate) onUpdate(data.tournament);
      } else {
        setMessage({ text: data.error || 'Erreur lors du démarrage du tournoi', type: 'error' });
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      setMessage({ text: 'Erreur serveur lors du démarrage du tournoi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // End tournament
  const endTournament = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir terminer le tournoi ?')) {
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetch(`/api/tournaments/${tournament._id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Tournoi terminé avec succès', type: 'success' });
        if (onUpdate) onUpdate(data.tournament);
      } else {
        setMessage({ text: data.error || 'Erreur lors de la clôture du tournoi', type: 'error' });
      }
    } catch (error) {
      console.error('Error ending tournament:', error);
      setMessage({ text: 'Erreur serveur lors de la clôture du tournoi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Delete tournament
  const deleteTournament = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/tournaments/${tournament._id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push('/admin/tournaments');
      } else {
        setMessage({ text: data.error || 'Erreur lors de la suppression du tournoi', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      setMessage({ text: 'Erreur serveur lors de la suppression du tournoi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <Link href="/admin/tournaments">
          <button className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            <ArrowLeft className="h-5 w-5 mr-1" /> Retour aux tournois
          </button>
        </Link>
        
        <div className="flex space-x-2">
          {tournament.status === 'draft' && (
            <button
              onClick={generateBracket}
              disabled={loading || tournament.participants.length < 2}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                <span>Générer l'arbre</span>
              </div>
            </button>
          )}
          
          {tournament.status === 'registration' && (
            <button
              onClick={startTournament}
              disabled={loading || !tournament.matches || tournament.matches.length === 0}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <Play className="h-4 w-4 mr-1" />
                <span>Démarrer le tournoi</span>
              </div>
            </button>
          )}
          
          {tournament.status === 'ongoing' && (
            <button
              onClick={endTournament}
              disabled={loading}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Terminer le tournoi</span>
              </div>
            </button>
          )}
          
          <button
            onClick={deleteTournament}
            disabled={loading}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              <Trash2 className="h-4 w-4 mr-1" />
              <span>Supprimer</span>
            </div>
          </button>
        </div>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tournament Form */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h1 className="text-2xl font-bold">
                {tournament._id ? `Modifier le tournoi: ${tournament.name}` : 'Créer un nouveau tournoi'}
              </h1>
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
                  + Ajouter un round
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
                  + Ajouter une récompense
                </button>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Participant Management */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Participants ({tournament.participants?.length || 0})
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                >
                  {showParticipants ? (
                    <UserMinus className="h-5 w-5" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            {showParticipants && (
              <div className="p-4">
                <ParticipantManager tournamentId={tournament._id} onUpdate={onUpdate} />
              </div>
            )}
            
            <div className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tournament.participants && tournament.participants.length > 0 ? (
                  tournament.participants.map((participant, index) => (
                    <div key={participant.userId || index} className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-3">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            {participant.userId.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Seed: {participant.seed || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          participant.status === 'registered' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          participant.status === 'checked_in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          participant.status === 'eliminated' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          participant.status === 'winner' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {participant.status === 'registered' ? 'Inscrit' :
                           participant.status === 'checked_in' ? 'Présent' :
                           participant.status === 'eliminated' ? 'Éliminé' :
                           participant.status === 'winner' ? 'Vainqueur' : 'Inconnu'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Aucun participant inscrit</p>
                  </div>
                )}
              </div>
              
              {tournament.participants && tournament.participants.length > 0 && tournament.status === 'draft' && (
                <div className="mt-4">
                  <button
                    onClick={generateBracket}
                    disabled={loading || tournament.participants.length < 2}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    {loading ? 'Génération...' : 'Générer l\'arbre'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}