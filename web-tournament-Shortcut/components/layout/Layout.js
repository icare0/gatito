// components/layout/Layout.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import LoadingScreen from '../shared/LoadingScreen';
import { useRouter } from 'next/router';

export default function Layout({ children, title = 'Shortpocket' }) {  // Mise à jour du title par défaut
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // S'assurer que le composant est monté avant d'ajouter des event listeners
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleStart = (url) => {
      // Ne pas déclencher d'écran de chargement si c'est juste un changement de locale
      if (url.includes(router.pathname) && url !== router.asPath) {
        return;
      }
      setLoading(true);
    };
    
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router, mounted]);

  // Create a single string for the title
  const pageTitle = `${title} | Discord Shortcut CA`;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 dark:text-gray-100 transition-colors duration-300">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Tournoi Shortpocket - Participez au tournoi exclusif sur le serveur Discord Shortcut du Crédit Agricole!" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <Navbar currentPage={router.pathname === '/' ? 'home' : router.pathname.slice(1)} />
          <main className="flex-grow relative">
            <div className="fixed bottom-4 right-4 z-50 lg:right-8 lg:bottom-8">
            </div>
            {children}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}