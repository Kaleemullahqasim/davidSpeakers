import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Only access auth after mounting to prevent SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Call useAuth at the top level of the component
  const { user, loading } = useAuth();

  // Only use auth state when mounted (client-side)
  useEffect(() => {
    if (isMounted && !loading && user) {
      if (user.role === 'student') {
        router.push('/dashboard/student');
      } else if (user.role === 'coach') {
        router.push('/dashboard/coach');
      } else if (user.role === 'admin') {
        router.push('/dashboard/admin');
      }
    }
  }, [isMounted, user, loading, router]);

  // Simple render that doesn't depend on auth context
  return (
    <>
      <Head>
        <title>David Speaker - AI Public Speaking Coach</title>
        <meta name="description" content="Improve your public speaking skills with AI-powered feedback and expert coaching" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <LandingPage />
      </main>
    </>
  );
}

// Add getServerSideProps to ensure the page is dynamically rendered
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  }
}
