// components/home/CountdownTimer.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

export default function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const { t } = useTranslation('common');
  
  useEffect(() => {
    // Pour le débogage: afficher les informations sur la date reçue
    console.log("🔍 CountdownTimer a reçu:", {
      endDate,
      type: typeof endDate,
      isDate: endDate instanceof Date,
      toString: String(endDate)
    });
    
    // Conversion avancée de la date de fin
    let endDateTime;
    let isValidDate = false;
    
    try {
      if (endDate instanceof Date) {
        endDateTime = endDate;
        isValidDate = !isNaN(endDateTime.getTime());
      } else if (typeof endDate === 'string') {
        endDateTime = new Date(endDate);
        isValidDate = !isNaN(endDateTime.getTime());
      } else if (endDate && typeof endDate === 'object' && endDate.$date) {
        // Format MongoDB étendu possible
        endDateTime = new Date(endDate.$date);
        isValidDate = !isNaN(endDateTime.getTime());
      } else {
        // Fallback date
        console.warn('🟠 Format de date non reconnu, utilisation du 30 Avril 2025');
        endDateTime = new Date('2025-04-30T23:59:59Z');
        isValidDate = true;
      }
      
      if (!isValidDate) {
        console.error('🔴 Date invalide dans CountdownTimer:', endDate);
        endDateTime = new Date('2025-04-30T23:59:59Z');
        isValidDate = true;
      }
    } catch (error) {
      console.error('🔴 Erreur lors de l\'analyse de la date:', error);
      endDateTime = new Date('2025-04-30T23:59:59Z');
      isValidDate = true;
    }
    
    const calculateTimeLeft = () => {
      try {
        // Récupérer le temps actuel
        const now = new Date();
        
        // Calculer la différence
        const difference = endDateTime.getTime() - now.getTime();
        
        // Vérifier si la date est future
        if (difference > 0) {
          // Calculer les jours, heures, minutes et secondes
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((difference / 1000 / 60) % 60);
          const seconds = Math.floor((difference / 1000) % 60);
          
          setTimeLeft({
            days,
            hours,
            minutes,
            seconds
          });
        } else {
          // Si la date est dépassée
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      } catch (error) {
        console.error('🔴 Erreur dans le calcul du temps restant:', error);
      }
    };
    
    // Calculer immédiatement
    calculateTimeLeft();
    
    // Puis mettre à jour chaque seconde
    const timer = setInterval(calculateTimeLeft, 1000);
    
    // Nettoyer l'intervalle
    return () => clearInterval(timer);
  }, [endDate]); // Recalculer si la date de fin change
  
  return (
    <section className="bg-gradient-to-r from-[#009898] to-[#006C4C] rounded-xl p-6 text-white text-center mb-12 shadow-lg relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('/images/ca-pattern.png')] bg-cover bg-center"></div>
      
      {/* Shortcut Logo Watermark */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
        <img src="/images/shortcut-ca-logo.png" alt="" className="w-64" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-4">
          <img src="/images/shortcut-ca-logo.png" alt="Shortcut" className="h-8 mr-3" />
          <h2 className="text-2xl font-bold">Tournoi Pokémon Pocket</h2>
        </div>
        
        <p className="text-green-200 mb-6">Fin des inscriptions dans:</p>
        
        <div className="flex justify-center gap-4 flex-wrap">
          <div className="bg-[#006C4C]/80 rounded-lg p-3 w-20 backdrop-blur-sm border border-white/10">
            <div className="text-3xl font-bold">{timeLeft.days}</div>
            <div className="text-xs uppercase">{t('days')}</div>
          </div>
          <div className="bg-[#006C4C]/80 rounded-lg p-3 w-20 backdrop-blur-sm border border-white/10">
            <div className="text-3xl font-bold">{timeLeft.hours}</div>
            <div className="text-xs uppercase">{t('hours')}</div>
          </div>
          <div className="bg-[#006C4C]/80 rounded-lg p-3 w-20 backdrop-blur-sm border border-white/10">
            <div className="text-3xl font-bold">{timeLeft.minutes}</div>
            <div className="text-xs uppercase">{t('minutes')}</div>
          </div>
          <div className="bg-[#006C4C]/80 rounded-lg p-3 w-20 backdrop-blur-sm border border-white/10">
            <div className="text-3xl font-bold">{timeLeft.seconds}</div>
            <div className="text-xs uppercase">{t('seconds')}</div>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-green-200">
          Inscrivez-vous dès maintenant en utilisant la commande <code className="bg-[#006C4C] px-1 rounded">/register</code> sur le serveur Discord Shortcut du Crédit Agricole
        </div>
        
        <a 
          href="https://discord.gg/83s7b9df8E" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-4 inline-block bg-white text-[#009898] font-medium px-6 py-2 rounded-full hover:bg-green-100 transition"
        >
          Rejoindre Discord
        </a>
      </div>
    </section>
  );
}