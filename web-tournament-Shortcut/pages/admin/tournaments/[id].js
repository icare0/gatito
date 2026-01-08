// pages/admin/tournaments/[id].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import TournamentManager from '../../../components/admin/TournamentManager';
import LoadingScreen from '../../../components/shared/LoadingScreen';
import { AlertTriangle } from 'lucide-react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { connectToDatabase } from '../../../lib/mongodb';

export default function AdminEditTournament({ initialTournament }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [tournament, setTournament] = useState(initialTournament);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if user is authenticated and is admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && !session.user.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);
  
  // Fetch tournament data if not provided or if ID changes
  useEffect(() => {
    if (router.query.id && !initialTournament) {
      fetchTournament();
    }
  }, [router.query.id, initialTournament]);
  
  // Fetch tournament data
  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${router.query.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTournament(data.tournament);
      } else {
        setError(data.error || 'Erreur lors de la récupération du tournoi');
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Erreur serveur lors de la récupération du tournoi');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tournament update
  const handleTournamentUpdate = (updatedTournament) => {
    setTournament(updatedTournament);
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
    <AdminLayout title={tournament ? `Modifier: ${tournament.name}` : 'Modifier un tournoi'}>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-red-800 dark:text-red-200 mb-2">Erreur</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      ) : tournament ? (
        <TournamentManager tournament={tournament} onUpdate={handleTournamentUpdate} />
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-lg text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-yellow-800 dark:text-yellow-200 mb-2">Tournoi non trouvé</h2>
          <p className="text-yellow-600 dark:text-yellow-300">Le tournoi que vous recherchez n'existe pas ou a été supprimé.</p>
        </div>
      )}
    </AdminLayout>
  );
}

export async function getServerSideProps({ params, locale, req }) {
  try {
    const { db } = await connectToDatabase();
    
    // Get the tournament
    const tournament = await db.collection('tournaments').findOne(
      { _id: params.id }
    );
    
    if (!tournament) {
      return {
        props: {
          ...(await serverSideTranslations(locale, ['common'])),
          initialTournament: null
        }
      };
    }
    
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialTournament: JSON.parse(JSON.stringify(tournament))
      }
    };
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialTournament: null
      }
    };
  }
}