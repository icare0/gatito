// pages/_app.js
import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // S'assurer que le composant est monté avant d'ajouter des event listeners
  useEffect(() => {
    setMounted(true);
    
    // Initialiser le mode sombre basé sur les préférences sauvegardées ou système
    const initDarkMode = () => {
      // Vérifier s'il s'agit du navigateur
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Appliquer le thème
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    // Initialiser le thème dès que possible
    initDarkMode();
    
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

  // Détection de la langue
  useEffect(() => {
    // Only run once on client-side to prevent multiple redirects
    if (typeof window !== 'undefined' && mounted) {
      // Check if language is already detected or stored
      const hasDetectedLanguage = sessionStorage.getItem('language-detected') === 'true';
      
      if (!hasDetectedLanguage) {
        // Mark language as detected to prevent future redirections
        sessionStorage.setItem('language-detected', 'true');
        
        // Get browser language
        const browserLanguage = navigator.language || navigator.userLanguage;
        const detectedLocale = browserLanguage.startsWith('fr') ? 'fr' : 'en';
        
        // Only redirect if on a different locale and not already processing a redirect
        if (router.locale !== detectedLocale && !router.asPath.includes('?redirected=true')) {
          // Add query param to prevent redirect loops
          const separator = router.asPath.includes('?') ? '&' : '?';
          const redirectPath = `${router.asPath}${separator}redirected=true`;
          
          // Use replace instead of push to avoid adding to browser history
          router.replace(redirectPath, redirectPath, { 
            locale: detectedLocale,
            shallow: true // Don't trigger getServerSideProps again
          });
        }
      }
    }
  }, [router.locale, router.asPath, mounted]);

  // Script d'initialisation du mode sombre
  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // On exécute ce script immédiatement pour éviter le flash de contenu blanc
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (err) {
                  console.error('Failed to initialize dark mode', err);
                }
              })();
            `,
          }}
        />
      </Head>
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
}

export default appWithTranslation(MyApp);