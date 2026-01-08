// components/home/HeroSection.js
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

export default function HeroSection() {
  const { t } = useTranslation('common');
  
  return (
    <section className="relative rounded-xl overflow-hidden bg-gradient-to-r from-[#009898] to-[#006C4C] shadow-lg mb-12">
      {/* Fond avec motif */}
      <div className="absolute inset-0 opacity-10 bg-[url('/images/ca-pattern.png')] bg-cover bg-center"></div>
      
      <div className="relative z-10 p-8 md:p-12 text-white">
        <div className="flex flex-col md:flex-row items-center mb-6">
          <div className="w-full md:w-3/4">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
              Tournoi <span className="text-green-200">Pokémon Pocket</span> - Discord du Crédit Agricole
            </h1>
            <p className="text-lg md:text-xl mb-6 max-w-3xl">
              Rejoignez-nous pour participer au tournoi exclusif Pokémon Pocket sur le serveur Discord Shortcut du Crédit Agricole. Affrontez d'autres joueurs et remportez des récompenses exceptionnelles!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/rules">
                <button className="bg-white hover:bg-green-100 text-[#009898] font-bold py-2 px-6 rounded-full transition transform hover:scale-105">
                  {t('view_rules')}
                </button>
              </Link>
              <Link href="/tournaments">
                <button className="bg-transparent hover:bg-[#006C4C] border-2 border-white text-white font-bold py-2 px-6 rounded-full transition transform hover:scale-105">
                  {t('tournament_details')}
                </button>
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/4 flex justify-center mt-6 md:mt-0">
            <div className="relative w-40 h-40 bg-white rounded-full p-3 shadow-lg">
              <img 
                src="/images/shortcut-ca-logo.png" 
                alt="Shortcut Logo" 
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 p-4 rounded-lg border border-white/20 mt-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-shrink-0">
              <img src="/images/credit-agricole-logo.png" alt="Crédit Agricole" className="h-8" />
            </div>
            <div>
              <p className="text-sm md:text-base">
                Rejoignez le serveur Discord Shortcut du Crédit Agricole et participez au tournoi Pokémon Pocket, l'événement exclusif avec des récompenses incroyables!
              </p>
            </div>
            <a 
              href="https://discord.gg/83s7b9df8E" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-white text-[#009898] font-medium px-4 py-2 rounded-full text-sm inline-flex items-center"
            >
              Rejoindre Discord
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}