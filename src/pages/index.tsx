import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'student') {
        router.push('/dashboard/student');
      } else if (user.role === 'coach') {
        router.push('/dashboard/coach');
      } else if (user.role === 'admin') {
        router.push('/dashboard/admin');
      }
    }
  }, [user, loading, router]);

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
