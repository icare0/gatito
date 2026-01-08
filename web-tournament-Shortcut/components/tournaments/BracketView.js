// components/tournaments/BracketView.js - VERSION CORRIGÉE COMPLÈTE
import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle, Trophy, User, Shield, Edit, CheckCircle,
  ZoomIn, ZoomOut, Move, Grid, List, Layers, RotateCcw,
  Eye, Settings, ChevronDown, ChevronRight
} from 'lucide-react';

// Composant pour gérer les avatars avec fallback
function PlayerAvatar({ src, alt, size = 32, className = "" }) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
  }, [src]);

  const handleImageError = () => {
    console.log('❌ Erreur de chargement d\'image:', src);
    setImageError(true);
  };

  // Si pas d'avatar ou erreur, afficher un avatar par défaut
  if (!imageSrc || imageError) {
    return (
      <div 
        className={`bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold rounded-full ${className}`}
        style={{ width: size, height: size, fontSize: `${size / 3}px` }}
      >
        {alt ? alt.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt || 'Avatar'}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={handleImageError}
      unoptimized // Évite les erreurs avec les avatars Discord
    />
  );
}

export default function BracketView({ tournament, users, isAdmin = false }) {
  const { data: session } = useSession();
  const [rounds, setRounds] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [userIsParticipant, setUserIsParticipant] = useState(false);
  const [viewMode, setViewMode] = useState('tree');
  const [showViewOptions, setShowViewOptions] = useState(false);

  // États pour la vue classique (zoom et pan)
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  // Références pour les éléments DOM
  const containerRef = useRef(null);
  const bracketRef = useRef(null);

  useEffect(() => {
    if (!tournament || !tournament.matches) return;

    console.log('🔍 DEBUG BracketView - Données reçues:', {
      tournament: tournament.name,
      participants: tournament.participants?.length,
      users: users?.length,
      matches: tournament.matches?.length,
      sampleMatch: tournament.matches?.[0],
      sampleUser: users?.[0],
      usersSample: users?.slice(0, 3).map(u => ({
        // Afficher les vrais champs de la DB
        _id: u._id,
        discordId: u.discordId,
        username: u.username,
        avatar: u.avatar,
        // Et les champs mappés
        iduser: u.iduser,
        pseudo: u.pseudo
      }))
    });

    // CORRECTION MAJEURE: Créer une map des utilisateurs avec les BONS noms de champs
    const usersObj = {};
    
    if (users && users.length > 0) {
      users.forEach(user => {
        // Utiliser les clés qui correspondent aux champs de la DB et aux mappings
        const userKeys = [];
        
        // Clés principales (mappées côté serveur)
        if (user.iduser) { // discordId mappé vers iduser
          userKeys.push(user.iduser);
          usersObj[user.iduser] = user;
        }
        
        // Clés originales de la DB
        if (user.discordId) {
          userKeys.push(user.discordId);
          usersObj[user.discordId] = user;
        }
        
        // _id MongoDB
        if (user._id) {
          const idString = user._id.toString ? user._id.toString() : user._id;
          userKeys.push(idString);
          usersObj[idString] = user;
        }
        
        console.log('👤 Ajout utilisateur:', {
          pseudo: user.pseudo || user.username,
          username: user.username,
          discordId: user.discordId,
          iduser: user.iduser,
          keys: userKeys,
          avatar: user.avatar ? 'has avatar' : 'no avatar'
        });
      });
      
      console.log('🗂️ UserMap créée avec clés:', Object.keys(usersObj).slice(0, 10));
    }

    // CORRECTION: Aussi ajouter les participants du tournoi dans la map
    if (tournament.participants && tournament.participants.length > 0) {
      tournament.participants.forEach(participant => {
        if (participant.userId && !usersObj[participant.userId]) {
          console.log('🎮 Ajout participant manquant:', {
            userId: participant.userId,
            pseudo: participant.pseudo
          });
          
          // Créer un utilisateur de fallback avec les données du participant
          const fallbackUser = {
            // Mapper vers les noms attendus
            iduser: participant.userId,
            discordId: participant.userId,
            _id: participant.userId,
            pseudo: participant.pseudo,
            username: participant.pseudo,
            avatar: null,
            elo: 1000,
            rank: 'unranked',
            isFromTournament: true
          };
          
          // Ajouter avec toutes les clés possibles
          usersObj[participant.userId] = fallbackUser;
          if (participant.userId !== participant.userId) {
            usersObj[participant.userId] = fallbackUser;
          }
        }
      });
    }

    setUserMap(usersObj);

    // Vérifier si l'utilisateur actuel est un participant
    if (session?.user?.id) {
      const isParticipant = tournament.participants?.some(p => p.userId === session.user.id);
      setUserIsParticipant(isParticipant);
    }

    // Organiser les matchs en arbre
    const roundsData = organizeAsTree(tournament);
    setRounds(roundsData);
  }, [tournament, users, session]);

  // Organiser les matchs en arbre avec positions calculées
  const organizeAsTree = (tournament) => {
    if (!tournament.matches || tournament.matches.length === 0) {
      return [];
    }

    // CORRECTION: Ajouter du débogage pour les matchs
    console.log('🏆 Organisation de l\'arbre:', {
      totalMatches: tournament.matches.length,
      sampleMatch: tournament.matches[0],
      matchPlayers: tournament.matches.slice(0, 3).map(m => ({
        matchId: m.matchId,
        player1: m.player1,
        player2: m.player2,
        player1Found: !!userMap[m.player1],
        player2Found: !!userMap[m.player2]
      }))
    });

    // Grouper les matchs par round
    const matchesByRound = {};
    tournament.matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    // Trier les rounds
    const sortedRounds = Object.keys(matchesByRound)
      .map(r => parseInt(r))
      .sort((a, b) => a - b);

    const rounds = [];
    const MATCH_HEIGHT = 120;
    const MATCH_SPACING = 40;

    // Traiter chaque round
    sortedRounds.forEach((roundNum, roundIndex) => {
      const matches = matchesByRound[roundNum].sort((a, b) => a.position - b.position);
      
      const round = {
        number: roundNum,
        name: getRoundName(roundNum, sortedRounds),
        matches: []
      };

      if (roundIndex === 0) {
        // Premier round : position simple
        matches.forEach((match, index) => {
          round.matches.push({
            ...match,
            y: index * (MATCH_HEIGHT + MATCH_SPACING),
            connections: []
          });
        });
      } else {
        // Rounds suivants : positionner au milieu des matchs précédents
        const prevRound = rounds[roundIndex - 1];
        
        matches.forEach((match) => {
          // Trouver les matchs précédents qui alimentent ce match
          const feedingMatches = findFeedingMatches(match, prevRound.matches);
          
          let yPosition = 0;
          let connections = [];
          
          if (feedingMatches.length > 0) {
            // Calculer la position au milieu des matchs qui l'alimentent
            const minY = Math.min(...feedingMatches.map(m => m.y));
            const maxY = Math.max(...feedingMatches.map(m => m.y));
            yPosition = (minY + maxY) / 2;
            
            // Créer les connexions
            connections = feedingMatches.map(feedMatch => ({
              fromX: 0,
              fromY: feedMatch.y + MATCH_HEIGHT / 2,
              toX: -200,
              toY: yPosition + MATCH_HEIGHT / 2,
              matchId: feedMatch.matchId
            }));
          } else {
            // Fallback : espacer uniformément
            yPosition = match.position * (MATCH_HEIGHT + MATCH_SPACING * 2);
          }
          
          round.matches.push({
            ...match,
            y: yPosition,
            connections: connections
          });
        });
      }

      rounds.push(round);
    });

    console.log('🌳 Arbre organisé:', rounds.map(r => ({ 
      round: r.number, 
      name: r.name, 
      matches: r.matches.length,
      positions: r.matches.map(m => m.y)
    })));

    return rounds;
  };

  // Trouver les matchs qui alimentent un match donné
  const findFeedingMatches = (currentMatch, prevMatches) => {
    const pos1 = (currentMatch.position * 2) - 1;
    const pos2 = currentMatch.position * 2;
    
    return prevMatches.filter(match => 
      match.position === pos1 || match.position === pos2
    );
  };

  // Déterminer le nom du round
  const getRoundName = (roundNum, allRounds) => {
    const maxRound = Math.max(...allRounds);
    
    if (roundNum === maxRound) return 'Finale';
    if (roundNum === maxRound - 1) return 'Demi-finales';
    if (roundNum === maxRound - 2) return 'Quarts de finale';
    if (roundNum === maxRound - 3) return 'Huitièmes de finale';
    return `Tour ${roundNum}`;
  };

  // Gestion du zoom
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));
  const handleReset = () => {
    setScale(0.8);
    setPosition({ x: 0, y: 0 });
  };

  // Gestion du déplacement (pan)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setStartDrag({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setStartDrag({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - startDrag.x,
      y: e.touches[0].clientY - startDrag.y
    });
  };

  const handleDragEnd = () => setIsDragging(false);

  // Options de vue
  const viewOptions = [
    {
      id: 'tree',
      name: 'Vue Arbre',
      description: 'Arbre avec connexions visuelles',
      icon: <Layers className="h-4 w-4" />
    },
    {
      id: 'list',
      name: 'Vue Liste',
      description: 'Matchs organisés par tours',
      icon: <List className="h-4 w-4" />
    },
    {
      id: 'compact',
      name: 'Vue Compacte',
      description: 'Version condensée',
      icon: <Grid className="h-4 w-4" />
    }
  ];

  if (!tournament || !tournament.matches || tournament.matches.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <h3 className="font-medium">Le bracket n'a pas encore été généré</h3>
        </div>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">
          L'organisateur doit d'abord finaliser les inscriptions et générer l'arbre du tournoi.
        </p>
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Arbre du Tournoi
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tournament.matches.length} matchs • {rounds.length} rounds
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sélecteur de vue */}
            <div className="relative">
              <button
                onClick={() => setShowViewOptions(!showViewOptions)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                {viewOptions.find(option => option.id === viewMode)?.icon}
                <span className="ml-2">{viewOptions.find(option => option.id === viewMode)?.name}</span>
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showViewOptions ? 'rotate-180' : ''}`} />
              </button>
              
              {showViewOptions && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-2">
                    {viewOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setViewMode(option.id);
                          setShowViewOptions(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition flex items-start gap-3 ${
                          viewMode === option.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {option.icon}
                        </div>
                        <div>
                          <div className="font-medium">{option.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {option.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contrôles de zoom (pour la vue arbre) */}
            {viewMode === 'tree' && (
              <div className="flex bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
                <button 
                  onClick={handleZoomOut} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg transition"
                  title="Dézoomer"
                >
                  <ZoomOut className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border-x border-gray-200 dark:border-gray-600">
                  {Math.round(scale * 100)}%
                </div>
                <button 
                  onClick={handleZoomIn} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  title="Zoomer"
                >
                  <ZoomIn className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button 
                  onClick={handleReset} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition border-l border-gray-200 dark:border-gray-600"
                  title="Réinitialiser"
                >
                  <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions pour la vue arbre */}
      {viewMode === 'tree' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 text-sm border-b border-blue-200 dark:border-blue-800">
          <p>🌳 Maintenez le clic pour déplacer l'arbre, utilisez les boutons de zoom. Les lignes montrent les connexions entre les matchs.</p>
        </div>
      )}

      {/* Rendu conditionnel selon le mode de vue */}
      <div className="p-4">
        {viewMode === 'tree' && (
          <TreeBracketView 
            rounds={rounds}
            userMap={userMap}
            isAdmin={isAdmin}
            currentUserId={session?.user?.id}
            tournamentId={tournament._id}
            scale={scale}
            position={position}
            isDragging={isDragging}
            containerRef={containerRef}
            bracketRef={bracketRef}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            handleDragEnd={handleDragEnd}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
          />
        )}
        
        {viewMode === 'compact' && (
          <CompactBracketView 
            rounds={rounds}
            userMap={userMap}
            isAdmin={isAdmin}
            currentUserId={session?.user?.id}
            tournamentId={tournament._id}
          />
        )}
        
        {viewMode === 'list' && (
          <ListBracketView 
            rounds={rounds}
            userMap={userMap}
            isAdmin={isAdmin}
            currentUserId={session?.user?.id}
            tournamentId={tournament._id}
          />
        )}
      </div>
    </div>
  );
}

// Vue Arbre avec connexions visuelles
function TreeBracketView({ 
  rounds, userMap, isAdmin, currentUserId, tournamentId,
  scale, position, isDragging, containerRef, bracketRef,
  handleMouseDown, handleMouseMove, handleDragEnd,
  handleTouchStart, handleTouchMove 
}) {
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden h-[80vh] min-h-[600px] max-w-full bg-gray-50 dark:bg-gray-900"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        ref={bracketRef}
        className="absolute top-0 left-0"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        <div className="bracket-tree p-12">
          <svg 
            className="absolute top-0 left-0 pointer-events-none z-0" 
            style={{ 
              width: '100%', 
              height: '100%',
              minWidth: '2000px',
              minHeight: '1000px'
            }}
          >
            {/* Dessiner les connexions */}
            {rounds.map((round, roundIndex) => 
              round.matches.map((match) => 
                match.connections.map((connection, connIndex) => (
                  <g key={`${match.matchId}-${connIndex}`}>
                    {/* Ligne horizontale depuis le match précédent */}
                    <line
                      x1={roundIndex * 300 + 280}
                      y1={connection.fromY + 48}
                      x2={roundIndex * 300 + 340}
                      y2={connection.fromY + 48}
                      stroke="#6b7280"
                      strokeWidth="2"
                      className="opacity-60"
                    />
                    {/* Ligne verticale de connexion */}
                    <line
                      x1={roundIndex * 300 + 340}
                      y1={connection.fromY + 48}
                      x2={roundIndex * 300 + 340}
                      y2={connection.toY + 48}
                      stroke="#6b7280"
                      strokeWidth="2"
                      className="opacity-60"
                    />
                    {/* Ligne horizontale vers le nouveau match */}
                    <line
                      x1={roundIndex * 300 + 340}
                      y1={connection.toY + 48}
                      x2={roundIndex * 300 + 380}
                      y2={connection.toY + 48}
                      stroke="#6b7280"
                      strokeWidth="2"
                      className="opacity-60"
                    />
                  </g>
                ))
              )
            )}
          </svg>

          <div className="relative z-10 flex">
            {rounds.map((round, roundIndex) => (
              <div key={round.number} className="flex flex-col mr-20" style={{ width: '280px' }}>
                {/* Header du round */}
                <div className="mb-8 text-center">
                  <div className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md inline-block">
                    <h3 className="font-bold text-lg">{round.name}</h3>
                    <div className="text-sm mt-1">
                      Round {round.number} • {round.matches.length} match{round.matches.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                {/* Matchs du round avec positions calculées */}
                <div className="relative">
                  {round.matches.map((match) => (
                    <div
                      key={match.matchId}
                      className="absolute w-full"
                      style={{ top: `${match.y + 48}px` }}
                    >
                      <MatchCard
                        match={match}
                        userMap={userMap}
                        isAdmin={isAdmin}
                        currentUserId={currentUserId}
                        tournamentId={tournamentId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Vue Compacte (version simple)
function CompactBracketView({ rounds, userMap, isAdmin, currentUserId, tournamentId }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
        {rounds.map((round) => (
          <div key={round.number} className="flex flex-col items-center">
            <div className="mb-4">
              <div className="px-3 py-1 bg-blue-500 text-white rounded text-center">
                <h3 className="font-bold text-xs">{round.name}</h3>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {round.matches.map((match) => (
                <CompactMatchCard
                  key={match.matchId}
                  match={match}
                  userMap={userMap}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  tournamentId={tournamentId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Vue Liste (version simple)
function ListBracketView({ rounds, userMap, isAdmin, currentUserId, tournamentId }) {
  const [expandedRounds, setExpandedRounds] = useState(new Set(rounds.map(r => r.number)));

  const toggleRound = (roundNumber) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber);
    } else {
      newExpanded.add(roundNumber);
    }
    setExpandedRounds(newExpanded);
  };

  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <div key={round.number} className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => toggleRound(round.number)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg transition"
          >
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium">
                {round.name}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {round.matches.length} match{round.matches.length > 1 ? 's' : ''}
              </span>
            </div>
            <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
              expandedRounds.has(round.number) ? 'rotate-90' : ''
            }`} />
          </button>
          
          {expandedRounds.has(round.number) && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {round.matches.map((match) => (
                <MatchCard
                  key={match.matchId}
                  match={match}
                  userMap={userMap}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  tournamentId={tournamentId}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Composant MatchCard amélioré avec débogage
function MatchCard({ match, userMap, isAdmin, currentUserId, tournamentId }) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [scores, setScores] = useState({
    player1: match.scores?.player1 || 0,
    player2: match.scores?.player2 || 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // CORRECTION: Améliorer la recherche des joueurs avec les bons noms de champs
  const findPlayer = (playerId) => {
    if (!playerId) return null;
    
    console.log('🔍 Recherche joueur:', {
      playerId,
      userMapHasKey: !!userMap[playerId],
      userMapSize: Object.keys(userMap).length,
      firstFewKeys: Object.keys(userMap).slice(0, 5)
    });
    
    // Chercher d'abord avec l'ID exact
    let player = userMap[playerId];
    
    if (player) {
      console.log('✅ Joueur trouvé directement:', {
        pseudo: player.pseudo || player.username,
        username: player.username,
        discordId: player.discordId,
        avatar: player.avatar,
        source: 'direct key match'
      });
      
      // S'assurer que les champs sont bien mappés
      return {
        ...player,
        // Garantir que pseudo est disponible (mapper depuis username si nécessaire)
        pseudo: player.pseudo || player.username || `Joueur ${playerId?.substring(0, 6)}`,
        iduser: player.iduser || player.discordId || playerId,
        avatar: player.avatar || null
      };
    }
    
    // Si pas trouvé, chercher dans toutes les valeurs de userMap
    const allUsers = Object.values(userMap);
    player = allUsers.find(user => 
      user.iduser === playerId || 
      user.discordId === playerId ||
      user.id === playerId || 
      (user._id && (user._id === playerId || user._id.toString() === playerId))
    );
    
    if (player) {
      console.log('✅ Joueur trouvé par recherche:', {
        pseudo: player.pseudo || player.username,
        username: player.username,
        discordId: player.discordId,
        avatar: player.avatar,
        source: 'value search',
        matchedBy: player.iduser === playerId ? 'iduser' : 
                   player.discordId === playerId ? 'discordId' :
                   player.id === playerId ? 'id' : '_id'
      });
      
      // S'assurer que les champs sont bien mappés
      return {
        ...player,
        pseudo: player.pseudo || player.username || `Joueur ${playerId?.substring(0, 6)}`,
        iduser: player.iduser || player.discordId || playerId,
        avatar: player.avatar || null
      };
    }
    
    // Si toujours pas trouvé, créer un joueur de fallback
    console.warn('⚠️ Joueur non trouvé, création fallback pour:', {
      playerId,
      availableUsers: allUsers.slice(0, 3).map(u => ({
        iduser: u.iduser,
        discordId: u.discordId,
        pseudo: u.pseudo,
        username: u.username
      }))
    });
    
    return {
      iduser: playerId,
      discordId: playerId,
      pseudo: `Joueur ${playerId?.substring(0, 6) || '?'}`,
      username: `Joueur ${playerId?.substring(0, 6) || '?'}`,
      avatar: null,
      elo: 1000,
      rank: 'unranked',
      isFallback: true
    };
  };

  const player1 = findPlayer(match.player1);
  const player2 = findPlayer(match.player2);
  const isParticipantMatch = match.player1 === currentUserId || match.player2 === currentUserId;

  const canReportScores = (isParticipantMatch || isAdmin) && match.status === 'in_progress';

  const getStatusColor = () => {
    switch (match.status) {
      case 'pending': return 'border-gray-200 dark:border-gray-700';
      case 'in_progress': return 'border-blue-300 dark:border-blue-700';
      case 'completed': return 'border-green-300 dark:border-green-700';
      case 'cancelled': return 'border-red-300 dark:border-red-700';
      default: return 'border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusBg = () => {
    switch (match.status) {
      case 'pending': return 'bg-white dark:bg-gray-800';
      case 'in_progress': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'completed': return 'bg-white dark:bg-gray-800';
      case 'cancelled': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-white dark:bg-gray-800';
    }
  };

  const handleScoreUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches/${match.matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scores: {
            player1: parseInt(scores.player1),
            player2: parseInt(scores.player2)
          },
          reportedBy: currentUserId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowUpdateForm(false);
        window.location.reload();
      } else {
        setError(data.error || 'Erreur lors de la mise à jour du match');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      setError('Erreur lors de la mise à jour du match');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setScores({ ...scores, [name]: value });
  };

  return (
    <div className={`w-full max-w-sm mx-auto rounded-lg shadow-md ${getStatusBg()} border-2 ${getStatusColor()} overflow-hidden bg-white dark:bg-gray-800`}>
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Match #{match.position}
        </div>
        <div className="flex items-center gap-2">
          {match.status === 'in_progress' && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full animate-pulse">
              En cours
            </span>
          )}
          {match.status === 'completed' && (
            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
              Terminé
            </span>
          )}
          {canReportScores && !showUpdateForm && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Joueur 1 */}
      <div className={`p-3 flex items-center justify-between border-b ${
        match.winner === match.player1
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-100 dark:border-gray-700'
      }`}>
        <div className="flex items-center flex-1 min-w-0">
          {player1 ? (
            <>
              <div className="mr-2 flex-shrink-0">
                <PlayerAvatar
                  src={player1.avatar}
                  alt={player1.pseudo}
                  size={32}
                  className="border border-gray-200 dark:border-gray-700"
                />
              </div>
              <span className="text-sm font-medium truncate">
                {player1.pseudo}
              </span>
            </>
          ) : (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">À déterminer</span>
            </div>
          )}
        </div>
        <div className="flex items-center ml-2">
          {match.status === 'completed' && (
            <>
              <div className="text-lg font-bold mr-2 bg-gray-100 dark:bg-gray-700 w-8 h-8 flex items-center justify-center rounded-full">
                {match.scores?.player1 || '0'}
              </div>
              {match.winner === match.player1 && (
                <Trophy className="h-5 w-5 text-yellow-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Joueur 2 */}
      <div className={`p-3 flex items-center justify-between ${
        match.winner === match.player2
          ? 'bg-green-50 dark:bg-green-900/20'
          : ''
      }`}>
        <div className="flex items-center flex-1 min-w-0">
          {player2 ? (
            <>
              <div className="mr-2 flex-shrink-0">
                <PlayerAvatar
                  src={player2.avatar}
                  alt={player2.pseudo}
                  size={32}
                  className="border border-gray-200 dark:border-gray-700"
                />
              </div>
              <span className="text-sm font-medium truncate">
                {player2.pseudo}
              </span>
            </>
          ) : (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">À déterminer</span>
            </div>
          )}
        </div>
        <div className="flex items-center ml-2">
          {match.status === 'completed' && (
            <>
              <div className="text-lg font-bold mr-2 bg-gray-100 dark:bg-gray-700 w-8 h-8 flex items-center justify-center rounded-full">
                {match.scores?.player2 || '0'}
              </div>
              {match.winner === match.player2 && (
                <Trophy className="h-5 w-5 text-yellow-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Formulaire de mise à jour des scores */}
      {showUpdateForm && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <form onSubmit={handleScoreUpdate}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Score final:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="player1"
                  min="0"
                  max="99"
                  value={scores.player1}
                  onChange={handleInputChange}
                  className="w-12 h-8 text-center border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="number"
                  name="player2"
                  min="0"
                  max="99"
                  value={scores.player2}
                  onChange={handleInputChange}
                  className="w-12 h-8 text-center border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 mb-2 text-center">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setShowUpdateForm(false)}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin inline-block h-3 w-3 mr-1 border-t-2 border-white rounded-full"></span>
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Carte de match compacte
function CompactMatchCard({ match, userMap, isAdmin, currentUserId, tournamentId }) {
  const findPlayer = (playerId) => {
    if (!playerId) return null;
    
    // Chercher d'abord avec l'ID exact
    let player = userMap[playerId];
    console.log("tedtetet", player)
    if (player) {
      return {
        ...player,
        pseudo: player.pseudo || player.username || `Joueur ${playerId?.substring(0, 6)}`,
        iduser: player.iduser || player.discordId || playerId,
        avatar: player.avatar || null
      };
    }
    
    // Chercher dans toutes les valeurs
    const allUsers = Object.values(userMap);
    player = allUsers.find(user => 
      user.iduser === playerId || 
      user.discordId === playerId ||
      user.id === playerId || 
      (user._id && (user._id === playerId || user._id.toString() === playerId))
    );
    
    if (player) {
      return {
        ...player,
        pseudo: player.pseudo || player.username || `Joueur ${playerId?.substring(0, 6)}`,
        iduser: player.iduser || player.discordId || playerId,
        avatar: player.avatar || null
      };
    }
    
    // Fallback
    return {
      iduser: playerId,
      discordId: playerId,
      pseudo: `Joueur ${playerId?.substring(0, 6) || '?'}`,
      avatar: null,
      elo: 1000,
      rank: 'unranked'
    };
  };

  const player1 = findPlayer(match.player1);
  const player2 = findPlayer(match.player2);

  return (
    <div className="w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Joueur 1 */}
      <div className={`p-2 flex items-center justify-between text-sm border-b ${
        match.winner === match.player1
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-100 dark:border-gray-700'
      }`}>
        <div className="flex items-center min-w-0 flex-1">
          {player1 ? (
            <>
              <div className="mr-2 flex-shrink-0">
                <PlayerAvatar
                  src={player1.avatar}
                  alt={player1.pseudo}
                  size={24}
                  className="border border-gray-200 dark:border-gray-700"
                />
              </div>
              <span className="truncate font-medium">{player1.pseudo}</span>
            </>
          ) : (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4 mr-1" />
              <span className="text-xs">À déterminer</span>
            </div>
          )}
        </div>
        {match.status === 'completed' && (
          <div className="flex items-center ml-2">
            <span className="text-lg font-bold mr-1">{match.scores?.player1 || '0'}</span>
            {match.winner === match.player1 && <Trophy className="h-4 w-4 text-yellow-500" />}
          </div>
        )}
      </div>

      {/* Joueur 2 */}
      <div className={`p-2 flex items-center justify-between text-sm ${
        match.winner === match.player2
          ? 'bg-green-50 dark:bg-green-900/20'
          : ''
      }`}>
        <div className="flex items-center min-w-0 flex-1">
          {player2 ? (
            <>
              <div className="mr-2 flex-shrink-0">
                <PlayerAvatar
                  src={player2.avatar}
                  alt={player2.pseudo}
                  size={24}
                  className="border border-gray-200 dark:border-gray-700"
                />
              </div>
              <span className="truncate font-medium">{player2.pseudo}</span>
            </>
          ) : (
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4 mr-1" />
              <span className="text-xs">À déterminer</span>
            </div>
          )}
        </div>
        {match.status === 'completed' && (
          <div className="flex items-center ml-2">
            <span className="text-lg font-bold mr-1">{match.scores?.player2 || '0'}</span>
            {match.winner === match.player2 && <Trophy className="h-4 w-4 text-yellow-500" />}
          </div>
        )}
      </div>
    </div>
  );
}