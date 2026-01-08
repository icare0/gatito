// pages/profile/me.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import LoadingScreen from '../../components/shared/LoadingScreen';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function MeProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Check if the user is authenticated
    if (status === 'authenticated') {
      // Redirect to the user's profile page
      router.push(`/profile/${session.user.id}`);
    } else if (status === 'unauthenticated') {
      // If not authenticated, redirect to login
      router.push('/auth/signin');
    }
  }, [status, session, router]);
  
  // Show a loading screen while figuring out where to redirect
  return <LoadingScreen />;
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'profile'])),
    },
  };
}