// pages/tournaments/[id].js - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Layout from '../../components/layout/Layout';
import BracketView from '../../components/tournaments/BracketView';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { 
  Calendar, 
  Trophy, 
  Users, 
  Clock, 
  Info, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit,
  ExternalLink,
  Gamepad2,
  Star,
  Award,
  MapPin,
  Globe
} from 'lucide-react';
import { connectToDatabase } from '../../lib/mongodb';

export default function TournamentDetailPage({ initialTournament, initialParticipants }) {
  // Debug logs améliorés
  console.log('🏆 TOURNAMENT DETAIL DEBUG:', {
    tournament: {
      name: initialTournament?.name,
      id: initialTournament?._id,
      participants: initialTournament?.participants?.length,
      matches: initialTournament?.matches?.length,
      sampleParticipants: initialTournament?.participants?.slice(0, 3)
    },
    initialParticipants: {
      count: initialParticipants?.length,
      sample: initialParticipants?.slice(0, 3)?.map(p => ({ id: p.iduser, pseudo: p.pseudo })),
      allIds: initialParticipants?.map(p => p.iduser)
    },
    matchData: {
      sampleMatches: initialTournament?.matches?.slice(0, 3)?.map(m => ({
        id: m.matchId,
        player1: m.player1,
        player2: m.player2,
        round: m.round
      }))
    }
  });

  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [tournament, setTournament] = useState(initialTournament);
  const [participants, setParticipants] = useState(initialParticipants || []);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showTournamentInfo, setShowTournamentInfo] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('bracket');
  
  useEffect(() => {
    // Check if user is registered for the tournament
    if (session?.user?.id && tournament?.participants) {
      const userRegistered = tournament.participants.some(
        participant => participant.userId === session.user.id
      );
      setIsRegistered(userRegistered);
    }
    
    // Check if user is admin
    if (session?.user?.isAdmin) {
      setIsAdmin(true);
    }
  }, [session, tournament]);
  
  // Refresh tournament data - AMÉLIORÉ avec meilleur debug
  const refreshTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${router.query.id}`);
      const data = await response.json();
      
      console.log('🔄 REFRESH TOURNAMENT DATA:', {
        success: data.success,
        tournament: data.tournament?.name,
        participants: data.participants?.length,
        participantsSample: data.participants?.slice(0, 3)?.map(p => ({ id: p.iduser, pseudo: p.pseudo }))
      });
      
      if (data.success) {
        setTournament(data.tournament);
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('❌ Error refreshing tournament:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Register for tournament
  const handleRegister = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournament._id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsRegistered(true);
        refreshTournament();
      }
    } catch (error) {
      console.error('Error registering for tournament:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Unregister from tournament
  const handleUnregister = async () => {
    if (!session) {
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir vous désinscrire de ce tournoi ?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournament._id}/participants`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsRegistered(false);
        refreshTournament();
      }
    } catch (error) {
      console.error('Error unregistering from tournament:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Date non définie';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date invalide';
    }
  };
  
  // Get tournament status label and color
  const getTournamentStatus = () => {
    if (!tournament) {
      return {
        label: 'Inconnu',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        textColor: 'text-gray-800 dark:text-gray-200',
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }

    const now = new Date();
    const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
    const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
    const registrationEndDate = tournament.registrationEndDate ? new Date(tournament.registrationEndDate) : null;
    
    if (tournament.status === 'draft') {
      return {
        label: 'En préparation',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        textColor: 'text-gray-800 dark:text-gray-200',
        icon: <Clock className="h-4 w-4" />
      };
    } else if (tournament.status === 'registration') {
      return {
        label: 'Inscriptions ouvertes',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
        textColor: 'text-blue-800 dark:text-blue-200',
        icon: <Users className="h-4 w-4" />
      };
    } else if (tournament.status === 'ongoing') {
      return {
        label: 'En cours',
        bgColor: 'bg-green-100 dark:bg-green-900',
        textColor: 'text-green-800 dark:text-green-200',
        icon: <Gamepad2 className="h-4 w-4" />
      };
    } else if (tournament.status === 'completed') {
      return {
        label: 'Terminé',
        bgColor: 'bg-purple-100 dark:bg-purple-900',
        textColor: 'text-purple-800 dark:text-purple-200',
        icon: <Trophy className="h-4 w-4" />
      };
    }
    
    return {
      label: 'Inconnu',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-800 dark:text-gray-200',
      icon: <AlertTriangle className="h-4 w-4" />
    };
  };

  // Calculer le nombre de rounds théorique
  const calculateExpectedRounds = () => {
    if (!tournament?.participants?.length) return 0;
    const numParticipants = tournament.participants.length;
    return Math.ceil(Math.log2(numParticipants));
  };

  // Calculer les statistiques du tournoi
  const getTournamentStats = () => {
    if (!tournament) return null;

    const totalParticipants = tournament.participants?.length || 0;
    const expectedRounds = calculateExpectedRounds();
    const currentMatches = tournament.matches?.length || 0;
    const completedMatches = tournament.matches?.filter(m => m.status === 'completed')?.length || 0;

    return {
      totalParticipants,
      expectedRounds,
      currentMatches,
      completedMatches,
      participantsData: participants // Utiliser les vraies données utilisateur
    };
  };
  
  const tournamentStatus = getTournamentStatus();
  const tournamentStats = getTournamentStats();
  
  if (!tournament) {
    return (
      <Layout title="Tournoi non trouvé">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg shadow text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Tournoi non trouvé</h1>
            <p className="text-red-600 dark:text-red-300 mb-6">
              Le tournoi que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <Link href="/tournaments">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                Voir tous les tournois
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={tournament.name}>
      <div className="relative">
        {/* Tournament Banner - Amélioré */}
        <div className="h-80 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
          {tournament.banner && (
            <Image
              src={tournament.banner}
              alt={tournament.name}
              layout="fill"
              objectFit="cover"
              className="opacity-30"
              priority
            />
          )}
          
          {/* Overlay avec motif */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/40"></div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
          
          <div className="container mx-auto px-4 py-8 relative h-full flex flex-col justify-end">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${tournamentStatus.bgColor} ${tournamentStatus.textColor} shadow-lg`}>
                    {tournamentStatus.icon}
                    <span className="ml-2">{tournamentStatus.label}</span>
                  </span>
                  
                  {tournament.featured && (
                    <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900 shadow-lg">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                  {tournament.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  
                  <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {tournamentStats?.totalParticipants || 0} participants
                    </span>
                  </div>
                  
                  <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Trophy className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {tournamentStats?.expectedRounds || 0} rounds prévus
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
                {isRegistered && tournament.status !== 'completed' && (
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg px-4 py-2 text-green-100">
                    <span className="text-sm font-medium">✓ Inscrit au tournoi</span>
                  </div>
                )}
                
                {isAdmin && (
                  <Link href={`/admin/tournaments/${tournament._id}`}>
                    <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-lg px-4 py-2 flex items-center transition">
                      <Edit className="h-4 w-4 mr-2" />
                      Gérer le tournoi
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="container mx-auto px-4">
          <div className="border-b border-gray-200 dark:border-gray-700 -mb-px">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('bracket')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'bracket'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Gamepad2 className="h-5 w-5 mr-2 inline" />
                Arbre du Tournoi
              </button>
              
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Info className="h-5 w-5 mr-2 inline" />
                Informations
              </button>
              
              <button
                onClick={() => setActiveTab('participants')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'participants'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Users className="h-5 w-5 mr-2 inline" />
                Participants ({tournamentStats?.totalParticipants || 0})
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Tournament Bracket Tab */}
          {activeTab === 'bracket' && (
            <div className="bracket-view-transition">
              {/* DEBUG INFO - À enlever en production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info (dev only):</h3>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p>📊 Participants récupérés: {participants.length}</p>
                    <p>🎯 Participants dans tournoi: {tournament.participants?.length || 0}</p>
                    <p>🎮 Matchs créés: {tournament.matches?.length || 0}</p>
                    <p>👥 Sample participants: {participants.slice(0, 3).map(p => p.pseudo || p.iduser).join(', ')}</p>
                    <p>🆔 IDs recherchés: {tournament.participants?.slice(0, 3).map(p => p.userId).join(', ')}</p>
                    <p>🔑 IDs trouvés: {participants.slice(0, 3).map(p => p.iduser || p.discordId).join(', ')}</p>
                    {tournament.matches?.length > 0 && (
                      <p>🔗 Sample match players: {tournament.matches[0].player1} vs {tournament.matches[0].player2}</p>
                    )}
                    {participants.length === 0 && tournament.participants?.length > 0 && (
                      <p className="text-red-600 dark:text-red-400">⚠️ PROBLÈME: Aucun participant trouvé dans la DB avec les IDs du tournoi !</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={refreshTournament}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
                    >
                      🔄 Actualiser données
                    </button>
                    <button 
                      onClick={() => {
                        console.log('FULL DEBUG DATA:', {
                          tournament: tournament,
                          participants: participants,
                          tournamentParticipants: tournament.participants
                        });
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      📋 Log complet
                    </button>
                  </div>
                </div>
              )}

              {/* STATS DU TOURNOI */}
              {tournamentStats && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {tournamentStats.totalParticipants}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {tournamentStats.expectedRounds}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rounds prévus</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {tournamentStats.currentMatches}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Matchs créés</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {tournamentStats.completedMatches}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Matchs terminés</div>
                  </div>
                </div>
              )}

              <BracketView 
                tournament={tournament} 
                users={participants} // Passer les vrais participants avec toutes leurs données
                isAdmin={isAdmin} 
              />
            </div>
          )}
          
          {/* Tournament Info Tab */}
          {activeTab === 'info' && (
            <div className="bracket-view-transition max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Description et détails */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      Description
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {tournament.description}
                    </p>
                  </div>
                  
                  {tournament.rules && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <button
                        onClick={() => setShowRules(!showRules)}
                        className="flex items-center justify-between w-full text-left text-xl font-bold text-gray-800 dark:text-gray-200 mb-4"
                      >
                        <span>Règlement</span>
                        {showRules ? (
                          <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                      
                      {showRules && (
                        <div className="prose dark:prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: tournament.rules }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Informations détaillées */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                      Détails du Tournoi
                    </h2>
                    
                    <div className="space-y-4">                     
                      <div className="flex items-start">
                        <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">Format</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {tournament.format === 'single_elimination' && 'Élimination directe'}
                            {tournament.format === 'double_elimination' && 'Double élimination'}
                            {tournament.format === 'round_robin' && 'Poules'}
                            {tournament.format === 'swiss' && 'Système suisse'}
                          </p>
                        </div>
                      </div>
                      
                      {tournamentStats && (
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">Statistiques</h3>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <p>Participants: {tournamentStats.totalParticipants}</p>
                              <p>Rounds prévus: {tournamentStats.expectedRounds}</p>
                              <p>Matchs à jouer: {tournamentStats.currentMatches}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {tournament.discordServerId && (
                        <div className="flex items-start">
                          <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">Discord</h3>
                            <a 
                              href={`https://discord.gg/83s7b9df8E`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                            >
                              Rejoindre le serveur Discord
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Récompenses */}
                  {tournament.prizes && tournament.prizes.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                        <Award className="h-5 w-5 text-yellow-500 mr-2" />
                        Récompenses
                      </h3>
                      <div className="space-y-3">
                        {tournament.prizes.map((prize, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                                prize.place === 1 ? 'bg-yellow-100 text-yellow-800' :
                                prize.place === 2 ? 'bg-gray-100 text-gray-800' :
                                prize.place === 3 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {prize.place}
                              </div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {prize.place === 1 ? '1ère place' :
                                 prize.place === 2 ? '2ème place' :
                                 prize.place === 3 ? '3ème place' :
                                 `${prize.place}ème place`}
                              </span>
                            </div>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {prize.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="bracket-view-transition max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Participants ({tournamentStats?.totalParticipants || 0})
                  </h2>
                  
                  {isRegistered && tournament.status !== 'completed' && (
                    <button
                      onClick={handleUnregister}
                      disabled={loading || tournament.status !== 'registration'}
                      className="text-sm px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded transition disabled:opacity-50"
                    >
                      Se désinscrire
                    </button>
                  )}
                </div>
                
                {participants && participants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {participants.map((participant, index) => (
                      <div key={participant.iduser} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                        <div className="flex items-center flex-1">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 mr-3">
                            <Image
                              src={participant.avatar || '/images/default-avatar.png'}
                              alt={participant.pseudo || 'Participant'}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200 dark:hover">
                                {participant.username || `Joueur ${index + 1}`}
                              </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Seed #{index + 1}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {participant.role === 'admin' && (
                            <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full mr-2">
                              Admin
                            </span>
                          )}
                          {participant.elo && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {participant.elo} ELO
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {tournament.participants?.length > 0 
                        ? `${tournament.participants.length} participants inscrits (données en cours de chargement...)`
                        : "Aucun participant inscrit pour le moment"
                      }
                    </p>
                    {tournament.participants?.length > 0 && participants.length === 0 && (
                      <button 
                        onClick={refreshTournament}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        Actualiser
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params, locale }) {
  try {
    const { db } = await connectToDatabase();
    
    console.log('🔍 RECHERCHE TOURNOI ID:', params.id);
    
    // Rechercher le tournoi
    let tournament = null;
    
    // D'abord essayer avec l'ID tel quel
    tournament = await db.collection('tournaments').findOne({ _id: params.id });
    
    // Si pas trouvé, essayer avec ObjectId
    if (!tournament) {
      try {
        const { ObjectId } = require('mongodb');
        tournament = await db.collection('tournaments').findOne({ _id: new ObjectId(params.id) });
      } catch (objectIdError) {
        console.log('❌ ID non valide pour ObjectId:', params.id);
      }
    }
    
    if (!tournament) {
      console.log('❌ Tournoi non trouvé avec ID:', params.id);
      return {
        props: {
          ...(await serverSideTranslations(locale, ['common'])),
          initialTournament: null,
          initialParticipants: []
        }
      };
    }
    
    console.log('✅ TOURNOI TROUVÉ:', {
      name: tournament.name,
      id: tournament._id,
      participantsInTournament: tournament.participants?.length || 0,
      matches: tournament.matches?.length || 0
    });
    
    // AMÉLIORATION: Récupérer les participants avec TOUTES leurs données et debugging
    let participants = [];
    let participantIds = [];
    
    if (tournament.participants && tournament.participants.length > 0) {
      participantIds = tournament.participants.map(p => p.userId).filter(Boolean);
      
      console.log('🔍 RECHERCHE PARTICIPANTS - ÉTAPE 1:', {
        totalParticipants: tournament.participants.length,
        participantIds: participantIds.slice(0, 5),
        participantIdsTypes: participantIds.slice(0, 3).map(id => ({ id, type: typeof id })),
        sampleParticipants: tournament.participants.slice(0, 3)
      });
      
      if (participantIds.length > 0) {
        // D'abord essayer avec iduser
        participants = await db.collection('users')
          .find({ iduser: { $in: participantIds } })
          .project({ 
            username: 1, 
            avatar: 1, 
            discordId: 1
          })
          .toArray();
        
        console.log('🔍 RECHERCHE PARTICIPANTS - ÉTAPE 2 (par iduser):', {
          requested: participantIds.length,
          found: participants.length,
          sampleFound: participants.slice(0, 3).map(p => ({ 
            discordId: p.iduser, 
            username: p.pseudo, 
            avatar: p.avatar ? 'oui' : 'non' 
          })),
          missingIds: participantIds.filter(id => !participants.find(p => p.iduser === id))
        });
        
        // Si aucun trouvé avec iduser, essayer avec discordId
        if (participants.length === 0) {
          console.log('🔄 TENTATIVE DE RECHERCHE PAR DISCORD ID...');
          participants = await db.collection('users')
            .find({ discordId: { $in: participantIds } })
            .project({ 
              discordId: 1, 
              username: 1, 
              avatar: 1, 
              elo: 1,
              rank: 1,
              role: 1,
            })
            .toArray();
          
          console.log('🔍 RECHERCHE PARTICIPANTS - ÉTAPE 3 (par discordId):', {
            found: participants.length,
            sampleFound: participants.slice(0, 3).map(p => ({ 
              discordId: p.discordId, 
              iduser: p.iduser,
              pseudo: p.username,
              avatar: p.avatar ? 'oui' : 'non'
            }))
          });
        }
        
        // Debug : afficher quelques utilisateurs de la collection pour comparaison
        const sampleUsers = await db.collection('users')
          .find({})
          .limit(3)
          .project({ iduser: 1, discordId: 1, pseudo: 1 })
          .toArray();
        
        console.log('🔍 SAMPLE USERS DANS LA DB:', {
          count: await db.collection('users').countDocuments(),
          sample: sampleUsers.map(u => ({
            iduser: u.iduser,
            discordId: u.discordId,
            pseudo: u.pseudo,
            iduserType: typeof u.iduser,
            discordIdType: typeof u.discordId
          }))
        });
      }
    }
    
    // NOUVEAU: Debug détaillé des matchs vs participants
    if (tournament.matches && tournament.matches.length > 0) {
      const matchPlayerIds = new Set();
      tournament.matches.forEach(match => {
        if (match.player1) matchPlayerIds.add(match.player1);
        if (match.player2) matchPlayerIds.add(match.player2);
      });
      
      console.log('🎮 ANALYSE MATCHS VS PARTICIPANTS:', {
        matchsTotal: tournament.matches.length,
        playersInMatches: Array.from(matchPlayerIds),
        playersFoundInDB: participants.map(p => p.iduser),
        sampleMatch: tournament.matches[0] ? {
          id: tournament.matches[0].matchId,
          player1: tournament.matches[0].player1,
          player2: tournament.matches[0].player2,
          round: tournament.matches[0].round
        } : null
      });
    }
    
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialTournament: JSON.parse(JSON.stringify(tournament)),
        initialParticipants: JSON.parse(JSON.stringify(participants))
      }
    };
  } catch (error) {
    console.error('❌ ERREUR SERVEUR getServerSideProps:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialTournament: null,
        initialParticipants: []
      }
    };
  }
}