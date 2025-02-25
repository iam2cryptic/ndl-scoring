'use client';

import dynamic from 'next/dynamic';

const RankingInterface = dynamic(() => import('@/components/RankingInterface'), {
  ssr: false
});

export default function Home() {
  return <RankingInterface />;
}