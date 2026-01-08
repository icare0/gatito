// components/home/Announcements.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation('common');
  
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements?limit=4');
        const data = await response.json();
        
        if (data.success && data.announcements.length > 0) {
          setAnnouncements(data.announcements);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error(t('error_loading_announcements'), error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
  }, [t]);
  
  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-[#009898]">{t('latest_news')}</h2>
        <div className="space-y-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  if (error && announcements.length === 0) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-[#009898]">{t('latest_news')}</h2>
        <div className="py-4 text-center">
          <p className="text-gray-500">Aucune annonce disponible pour le moment</p>
        </div>
      </section>
    );
  }
  
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-[#009898] mb-4">{t('latest_news')}</h2>
      <div className="space-y-4">
        {announcements.map(announcement => (
          <div key={announcement.id || announcement._id} className="border-b border-gray-200 pb-4">
            <h3 className="font-bold text-lg text-[#009898]">{announcement.title}</h3>
            <p className="text-gray-600 mb-2">{announcement.content}</p>
            <span className="text-sm text-gray-500">
              {new Date(announcement.date || announcement.publishedAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}