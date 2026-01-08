import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import { Trophy, Calendar, Users, Medal, Zap, ExternalLink, ChevronRight, Star, Shield, Clock } from 'lucide-react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({ days: 15, hours: 8, minutes: 43, seconds: 12 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    // Animate entrance
    setIsLoaded(true);
    
    // Countdown timer simulation
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout title="Shortpocket - Tournoi Pokémon Pocket">
      {/* Hero Section with Animated Background */}
      <div className={`relative overflow-hidden bg-gradient-to-r from-[#009898] to-[#006C4C] transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Pokemon-inspired background pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/ca-pattern.png')] bg-repeat"></div>
          <div className="grid grid-cols-10 grid-rows-10 gap-8 w-full h-full">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i} 
                className="w-12 h-12 rounded-full bg-white animate-pulse" 
                style={{ 
                  position: 'absolute',
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`, 
                  animationDuration: `${5 + Math.random() * 5}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="lg:w-3/5 text-white">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4 animate-bounce">
                Tournoi PokémonPocket by Shortcut
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Tournoi <span className="text-yellow-300">Pokémon Pocket</span> <br/>
                <span className="relative">
  sur <div className="absolute -top-6 -right-8 rotate-12 text-yellow-300 text-2xl"></div> 
</span>
                Shortcut
              </h1>
              <p className="text-xl text-green-100 mb-8 max-w-xl">
                Affrontez les meilleurs dresseurs de la communauté et tentez de remporter des récompenses exclusives !
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://discord.gg/Shortcut" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-yellow-100 text-[#009898] px-8 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 hover:shadow-lg flex items-center"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" />
                  </svg>
                  Rejoindre Discord
                </a>
                <Link href="/rules">
                  <button className="bg-transparent hover:bg-white/10 border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 flex items-center">
                    Voir le règlement
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="lg:w-2/5 flex justify-center relative">
              {/* Pokéball améliorée */}
              <div className="relative w-72 h-72">
                <div className="absolute inset-0 rounded-full shadow-2xl overflow-hidden">
                  {/* Fond de la pokéball avec effet de brillance */}
                  <div className="w-full h-full bg-gradient-to-br from-white via-white to-gray-100 relative overflow-hidden">
                    {/* Partie supérieure rouge */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-br from-red-600 to-red-500"></div>
                    
                    {/* Bordure centrale */}
                    <div className="absolute top-1/2 left-0 right-0 h-4 bg-black transform -translate-y-1/2"></div>
                    
                    {/* Cercle central */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full border-8 border-black z-10 flex items-center justify-center shadow-inner">
                      {/* Logo du Crédit Agricole */}
                      <img 
                        src="/images/shortcut-ca-logo.png" 
                        alt="Shortcut Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    
                    {/* Reflet */}
                    <div className="absolute top-5 left-12 w-12 h-4 bg-white/50 rounded-full rotate-45 blur-sm"></div>
                    <div className="absolute bottom-10 right-10 w-8 h-3 bg-white/30 rounded-full rotate-45 blur-sm"></div>
                  </div>
                </div>
                
                {/* Effets d'animation */}
                <div className="absolute -inset-6 border-4 border-white/30 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
                <div className="absolute -inset-12 border-4 border-white/20 rounded-full animate-ping" style={{animationDuration: '4s'}}></div>
                <div className="absolute -inset-18 border-4 border-white/10 rounded-full animate-ping" style={{animationDuration: '5s'}}></div>
                
                {/* Particules */}
                <div className="absolute top-0 left-1/4 w-4 h-4 bg-yellow-300 rounded-full animate-float opacity-80" style={{animationDuration: '3s'}}></div>
                <div className="absolute bottom-1/4 right-0 w-3 h-3 bg-yellow-300 rounded-full animate-float opacity-80" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Countdown Section */}
      <div className="bg-white dark:bg-gray-800 py-6 shadow-md relative z-20 translate-y-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-[#009898] flex items-center justify-center md:justify-start">
                <Clock className="h-5 w-5 mr-2" />
                Fin des inscriptions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Rejoignez Discord et allez dans <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-[#009898]">"Event-tournois-tcg-pocket"</code> pour vous inscrire</p>
            </div>
            </div>
          </div>
        </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Tournament Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className={`rounded-2xl overflow-hidden shadow-lg transition duration-300 transform hover:-translate-y-2 hover:shadow-xl bg-white dark:bg-gray-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '0.1s'}}>
            <div className="h-3 bg-[#009898]"></div>
            <div className="p-6">
              <div className="w-12 h-12 bg-[#009898]/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-[#009898]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Date du tournoi</h3>
              <p className="text-gray-600 dark:text-gray-400">7 juin 2025</p>
            </div>
          </div>
          
          <div className={`rounded-2xl overflow-hidden shadow-lg transition duration-300 transform hover:-translate-y-2 hover:shadow-xl bg-white dark:bg-gray-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '0.2s'}}>
            <div className="h-3 bg-[#006C4C]"></div>
            <div className="p-6">
              <div className="w-12 h-12 bg-[#006C4C]/10 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-[#006C4C]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Récompenses</h3>
              <p className="text-gray-600 dark:text-gray-400">190€ de cashprize !</p>
            </div>
          </div>
          
          <div className={`rounded-2xl overflow-hidden shadow-lg transition duration-300 transform hover:-translate-y-2 hover:shadow-xl bg-white dark:bg-gray-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: '0.3s'}}>
            <div className="h-3 bg-[#009898]"></div>
            <div className="p-6">
              <div className="w-12 h-12 bg-[#009898]/10 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#009898]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Format</h3>
              <p className="text-gray-600 dark:text-gray-400">Élimination directe en arbre de tournoi</p>
            </div>
          </div>
        </div>
        
        {/* Tournament Format Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Déroulement du tournoi</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Suivez les différentes étapes du tournoi et affrontez les meilleurs joueurs de la communauté Discord Shortcut.</p>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#009898] to-[#006C4C] transform -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-[#009898] transform transition hover:-translate-y-1 hover:shadow-xl">
                <div className="w-12 h-12 rounded-full bg-[#009898] text-white flex items-center justify-center text-lg font-bold mb-4 mx-auto">1</div>
                <h3 className="text-lg font-bold mb-2 text-center text-gray-800 dark:text-gray-200">32e et 16e de finale</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">Élimination directe. Matchs en BO1. arbre de tournoi.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-[#009898] transform transition hover:-translate-y-1 hover:shadow-xl">
                <div className="w-12 h-12 rounded-full bg-[#009898] text-white flex items-center justify-center text-lg font-bold mb-4 mx-auto">2</div>
                <h3 className="text-lg font-bold mb-2 text-center text-gray-800 dark:text-gray-200">8e de finale</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">Élimination directe. Matchs en BO1. Les vainqueurs poursuivent.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-[#009898] transform transition hover:-translate-y-1 hover:shadow-xl">
                <div className="w-12 h-12 rounded-full bg-[#009898] text-white flex items-center justify-center text-lg font-bold mb-4 mx-auto">3</div>
                <h3 className="text-lg font-bold mb-2 text-center text-gray-800 dark:text-gray-200">Quarts et demis</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">Matchs en BO3. Les vainqueurs continuent l'aventure.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-[#009898] transform transition hover:-translate-y-1 hover:shadow-xl">
                <div className="w-12 h-12 rounded-full bg-[#009898] text-white flex items-center justify-center text-lg font-bold mb-4 mx-auto">4</div>
                <h3 className="text-lg font-bold mb-2 text-center text-gray-800 dark:text-gray-200">Grande finale</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">Match en BO3. Le gagnant remporte le tournoi et les récompenses.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* How to participate */}
        <div className="mb-16 bg-gradient-to-r from-[#009898] to-[#006C4C] rounded-2xl overflow-hidden shadow-xl">
          <div className="relative">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/ca-pattern.png')] bg-repeat"></div>
              <div className="absolute h-64 w-64 rounded-full bg-white/30 -top-20 -right-20 backdrop-blur-xl"></div>
              <div className="absolute h-32 w-32 rounded-full bg-white/30 bottom-10 left-10 backdrop-blur-xl"></div>
            </div>
            
            <div className="p-8 md:p-12 relative z-10">
              <div className="md:flex items-center">
                <div className="md:w-1/2 mb-8 md:mb-0">
                  <h2 className="text-3xl font-bold mb-4 text-white">Comment participer</h2>
                  <p className="text-green-100 mb-6">Suivez ces étapes simples pour vous inscrire au tournoi et tenter de remporter des récompenses exclusives !</p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-white text-[#009898] flex items-center justify-center font-bold mr-4 flex-shrink-0">1</div>
                      <div>
                        <h3 className="font-bold text-white mb-1">Rejoindre Discord</h3>
                        <p className="text-green-100">Rejoignez le serveur Discord Shortcut.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-white text-[#009898] flex items-center justify-center font-bold mr-4 flex-shrink-0">2</div>
                      <div>
                        <h3 className="font-bold text-white mb-1">S'inscrire au tournoi</h3>
                        <p className="text-green-100">allez dans <code className="bg-white/20 px-1 rounded">"event-tournoi-pokémon-tcg-pocket"</code> et cliquez sur s'inscrire.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-white text-[#009898] flex items-center justify-center font-bold mr-4 flex-shrink-0">3</div>
                      <div>
                        <h3 className="font-bold text-white mb-1">Préparer ses équipes</h3>
                        <p className="text-green-100">Constituez vos équipes, pas de limite sur le type de pokémon.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-white text-[#009898] flex items-center justify-center font-bold mr-4 flex-shrink-0">4</div>
                      <div>
                        <h3 className="font-bold text-white mb-1">Jouer et gagner</h3>
                        <p className="text-green-100">Participez aux matchs et tentez de remporter le tournoi !</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <a 
                      href="https://discord.gg/shortcut" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white text-[#009898] px-6 py-3 rounded-lg font-bold inline-flex items-center hover:bg-yellow-100 transition"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" />
                      </svg>
                      S'inscrire maintenant
                    </a>
                  </div>
                </div>
                
                <div className="md:w-1/2 md:pl-12 flex justify-center">
                  <div className="relative w-64 h-64">
                    {/* Discord-themed floating element with CA logo */}
                    <div className="absolute inset-0 bg-[#5865F2] rounded-2xl shadow-2xl p-8 flex items-center justify-center transform hover:rotate-3 transition duration-300">
                      <img 
                        src="/images/shortcut-ca-logo.png" 
                        alt="Shortcut Logo" 
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Command tooltip */}
                      <div 
                        className={`absolute top-0 -right-4 transform -translate-y-1/2 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg ${showTooltip ? 'opacity-100' : 'opacity-0'} transition duration-300`}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <div className="font-mono text-sm">/register</div>
                        <div className="absolute bottom-0 right-8 transform translate-y-1/2 rotate-45 w-4 h-4 bg-white"></div>
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Prizes Section */}
        <div className="mb-16" id="prizes">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Récompenses à gagner</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Les meilleurs joueurs du tournoi se partageront des récompenses exclusives !</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 dark:from-yellow-800/30 dark:to-yellow-900/30 rounded-xl overflow-hidden shadow-lg transform transition hover:-translate-y-2 hover:shadow-xl">
              <div className="h-3 bg-yellow-500"></div>
              <div className="px-6 pt-6 pb-8 text-center">
                <div className="bg-yellow-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="bg-yellow-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded inline-block mb-2">1ère place</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">50€ de carte cadeau</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">50€ de carte cadeau</p>
                <div className="flex justify-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                  <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                  <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl overflow-hidden shadow-lg transform transition hover:-translate-y-2 hover:shadow-xl">
              <div className="h-3 bg-gray-400"></div>
              <div className="px-6 pt-6 pb-8 text-center">
                <div className="bg-gray-400/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Medal className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="bg-gray-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded inline-block mb-2">2ème place</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">30€ de carte cadeau</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">30€ de carte cadeau</p>
                <div className="flex justify-center space-x-1">
                  <Star className="h-5 w-5 text-gray-400" fill="currentColor" />
                  <Star className="h-5 w-5 text-gray-400" fill="currentColor" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-800/30 dark:to-amber-900/30 rounded-xl overflow-hidden shadow-lg transform transition hover:-translate-y-2 hover:shadow-xl">
              <div className="h-3 bg-amber-600"></div>
              <div className="px-6 pt-6 pb-8 text-center">
                <div className="bg-amber-600/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Medal className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="bg-amber-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded inline-block mb-2">3ème place</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">20€ de carte cadeau</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">30€ de carte cadeau</p>
                <div className="flex justify-center space-x-1">
                  <Star className="h-5 w-5 text-amber-600" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Other prizes */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Récompenses supplémentaires</h3>
            <div className="flex items-center mb-4">
              <div className="bg-[#009898]/10 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                <Trophy className="h-6 w-6 text-[#009898]" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200">4ème à 8ème place et 8ème à 16ème place </h4>
                <p className="text-gray-600 dark:text-gray-400">10€ et 5€ de carte cadeau</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rules Section */}
        <div className="mb-16" id="rules">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Règlement</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Règles à respecter pour participer au tournoi Pokémon Pocket.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-[#009898]" />
                  Règles générales
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#009898] text-white flex items-center justify-center text-xs mr-3 mt-0.5">✓</div>
                    <span>Les participants doivent être membres du serveur Discord Shortcut</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#009898] text-white flex items-center justify-center text-xs mr-3 mt-0.5">✓</div>
                    <span>Inscription avant le 7 juin 2025</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#009898] text-white flex items-center justify-center text-xs mr-3 mt-0.5">✓</div>
                    <span>Les participants doivent posséder le jeu Pokémon Pocket</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#009898] text-white flex items-center justify-center text-xs mr-3 mt-0.5">✓</div>
                    <span>Être disponible aux dates du tournoi (7 et 8 juin 2025)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-[#009898]" />
                  Règles des matchs
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#009898] text-white flex items-center justify-center text-xs mr-3 mt-0.5">✓</div>
                    <span>Format Single Battle (1v1), aucune restriction au niveau des pokémons</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/rules">
                <button className="inline-flex items-center px-6 py-3 bg-[#009898] text-white rounded-lg font-medium hover:bg-[#006C4C] transition">
                  Voir le règlement complet
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* CTA Banner */}
        <div className="rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#009898] to-[#006C4C] p-8 md:p-12 relative">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/ca-pattern.png')] bg-repeat"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Prêt à participer ?</h2>
                <p className="text-green-100">Rejoignez le Discord Shortcut et inscrivez-vous dès maintenant !</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://discord.gg/Shortcut" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-yellow-100 text-[#009898] px-6 py-3 rounded-lg font-bold inline-flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" />
                  </svg>
                  Rejoindre Discord
                </a>
                
                <Link href="/tournaments">
                  <button className="bg-transparent hover:bg-white/10 border-2 border-white text-white px-6 py-3 rounded-lg font-bold inline-flex items-center justify-center transition">
                    Détails du tournoi
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}