import DashboardLayout from '@/components/layouts/DashboardLayout';
import { NextPage } from 'next';
import { ReactElement } from 'react';
import Head from 'next/head';

type PageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const LearningResources: PageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Learning Resources | David Speaker</title>
        <meta name="description" content="Learning resources for improving your presentation skills" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Learning Resources</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-7xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              Our team is currently creating high-quality learning resources to help you improve your presentation skills.
              Check back soon for videos, articles, and interactive exercises!
            </p>
            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="text-gray-500">
                Have suggestions for learning resources you'd like to see? 
                Send your ideas to <a href="mailto:support@davidspeaker.com" className="text-primary hover:underline">support@davidspeaker.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

LearningResources.getLayout = (page) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default LearningResources;