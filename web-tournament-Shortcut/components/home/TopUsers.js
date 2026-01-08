// components/home/TopUsers.js
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';

export default function TopUsers({ users }) {
  const { t } = useTranslation('common');

  if (!users || users.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Top Joueurs</h2>
          <Link href="/leaderboard">
            <span className="text-[#009898] hover:text-[#006C4C] font-medium cursor-pointer">
              {t('see_all')} →
            </span>
          </Link>
        </div>
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <p>Chargement des joueurs...</p>
        </div>
      </section>
    );
  }
  
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Top Joueurs</h2>
        <Link href="/leaderboard">
          <span className="text-[#009898] hover:text-[#006C4C] font-medium cursor-pointer">
            {t('see_all')} →
          </span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {users.slice(0, 3).map((user, index) => (
          <Link href={`/profile/${user.iduser}`} key={user.iduser}>
            <div 
              className="relative bg-white rounded-lg overflow-hidden shadow-lg border-t-4 hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
              style={{ 
                borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'transparent' 
              }}
            >
              {/* Position Marker */}
              <div 
                className="absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-white font-bold rounded-br-lg"
                style={{ 
                  backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'transparent' 
                }}
              >
                {index + 1}
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 overflow-hidden">
                    <Image 
                      src={user.avatar || '/images/default-avatar.png'} 
                      alt={`${user.pseudo} avatar`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-800">{user.pseudo}</h3>
                    <p className="text-sm text-gray-600">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block mr-2 ${
                        user.rank === 'diamond' ? 'bg-cyan-100 text-cyan-800' :
                        user.rank === 'platinum' ? 'bg-indigo-100 text-indigo-800' :
                        user.rank === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        user.rank === 'silver' ? 'bg-gray-100 text-gray-800' :
                        user.rank === 'bronze' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.rank?.toUpperCase() || 'UNRANKED'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ELO:</span>
                    <span className="font-semibold">{user.elo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Winrate:</span>
                    <span className="font-semibold">{user.winRate?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}