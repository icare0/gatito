// pages/index.js
import React, { useEffect, useState } from 'react';
import Layout from './../../components/layout/Layout';
import HeroSection from './../../components/home/HeroSection';
import CountdownTimer from '../../components/home/CountdownTimer';
import HowItWorks from '../../components/home/HowItWorks';
import { getGlobalStats } from '../../lib/db';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { Calendar, Trophy, Users, ExternalLink } from 'lucide-react';

export default function Home({ globalStats }) {
  const { t } = useTranslation('common');
  const [endDate, setEndDate] = useState(null);
  
  // Fonction pour tenter de créer une date valide
  const createValidDate = (dateInput) => {
    // Vérification et conversion de la date
    if (!dateInput) return null;
    
    try {
      // Si c'est déjà une Date, la retourner directement
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput;
      }
      
      // Si c'est une chaîne, essayer de la parser
      if (typeof dateInput === 'string') {
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // Si c'est un timestamp numérique
      if (typeof dateInput === 'number') {
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // Si c'est un objet avec une propriété $date (format MongoDB)
      if (dateInput && typeof dateInput === 'object' && dateInput.$date) {
        const parsedDate = new Date(dateInput.$date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // Logging des problèmes
      console.warn("⚠️ Format de date non reconnu:", dateInput);
      // Date par défaut pour les inscriptions
      return new Date('2025-04-30T23:59:59Z');
    } catch (error) {
      console.error("🔴 Erreur lors de la création de la date:", error);
      return new Date('2025-04-30T23:59:59Z');
    }
  };
  
  useEffect(() => {
    // Pour le débogage
    console.log("🔍 Données reçues dans Home:", {
      globalStats,
      hasCurrentSeason: !!globalStats?.currentSeason,
      endDateValue: globalStats?.currentSeason?.endDate,
      endDateType: typeof globalStats?.currentSeason?.endDate
    });
    
    // Utiliser la date de fin des inscriptions au tournoi
    // Date par défaut pour les inscriptions au tournoi
    const tournamentRegistrationEnd = new Date('2025-04-30T23:59:59Z');
    setEndDate(tournamentRegistrationEnd);
    
  }, [globalStats]);
  
  // Formater la date pour l'affichage et le débogage
  const formattedEndDate = endDate ? endDate.toISOString() : 'Non définie';
  
  return (
    <Layout title={t('home')}>
      <div className="container mx-auto px-4 py-8">
        <HeroSection />
        
        {/* Afficher un message de débogage en mode développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 text-xs text-gray-700 rounded">
            Debug: Date de fin des inscriptions transmise au timer: {formattedEndDate}
          </div>
        )}
        
        {/* Passer la date au CountdownTimer seulement quand elle est prête */}
        {endDate && <CountdownTimer endDate={endDate} />}
        
        {/* Carte d'information sur le tournoi */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-12 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-[#009898] to-[#006C4C] text-white">
            <h2 className="text-2xl font-bold mb-2">Tournoi Pokémon Pocket</h2>
            <p className="text-green-100">
              Un événement spécial sur le serveur Discord Shortcut du Crédit Agricole
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-start">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg text-blue-700 dark:text-blue-300 mr-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">Dates du tournoi</h3>
                  <p className="text-gray-600 dark:text-gray-400">Du 1er au 10 mai 2025</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg text-purple-700 dark:text-purple-300 mr-4">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">Prix à gagner</h3>
                  <p className="text-gray-600 dark:text-gray-400">Cartes cadeaux et goodies exclusifs</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg text-green-700 dark:text-green-300 mr-4">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">Participants</h3>
                  <p className="text-gray-600 dark:text-gray-400">Places limitées à 128 joueurs</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mb-6">
              <Link href="/rules">
                <a className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#009898] hover:bg-[#006C4C] focus:outline-none mr-4">
                  Consulter le règlement
                </a>
              </Link>
              
              <a 
                href="https://discord.gg/83s7b9df8E" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-[#006C4C] text-base font-medium rounded-md text-[#009898] bg-white hover:bg-gray-50 focus:outline-none"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Rejoindre Discord
              </a>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> Pour vous inscrire au tournoi, rejoignez le serveur Discord Shortcut et utilisez la commande <code>/register</code> dans le canal dédié au tournoi.
              </p>
            </div>
          </div>
        </div>
        
        <HowItWorks />
        
        {/* Section des prochains tournois */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#009898]">Fonctionnement du tournoi</h2>
            <Link href="/tournaments">
              <a className="text-[#009898] hover:text-[#006C4C] font-medium">
                Voir les détails →
              </a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Phase de poules</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Groupes de 4 joueurs, matchs en BO1. Les 2 premiers se qualifient.</p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">16e et 8e de finale</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Élimination directe, matchs en BO1. Tableau généré aléatoirement.</p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Quarts et demi-finales</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Matchs en BO3. Les vainqueurs continuent l'aventure.</p>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mx-auto mb-4">
                <span className="text-xl font-bold">4</span>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Grande finale</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Match en BO5. Le gagnant remporte le tournoi et les récompenses.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  try {
    const globalStats = await getGlobalStats();
    
    // Vérifier et formater les données de date
    if (globalStats?.currentSeason?.endDate) {
      // Si c'est un objet Date, le convertir en string ISO
      if (globalStats.currentSeason.endDate instanceof Date) {
        globalStats.currentSeason.endDate = globalStats.currentSeason.endDate.toISOString();
      }
      
      // Pour le débogage côté serveur
      console.log("🔍 Date de fin dans getServerSideProps:", globalStats.currentSeason.endDate);
    }
    
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        globalStats: JSON.parse(JSON.stringify(globalStats))
      }
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        globalStats: {
          currentSeason: {
            number: '4',
            endDate: '2025-04-30T23:59:59Z',
            startDate: '2025-05-01T00:00:00Z',
            name: 'Tournoi Pokémon Pocket'
          }
        }
      }
    };
  }
}