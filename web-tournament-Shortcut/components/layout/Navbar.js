// components/layout/Navbar.js
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthButton from '../auth/AuthButton';
import { useTranslation } from 'next-i18next';
import DarkModeToggle from '../shared/DarkModeToggle';

export default function Navbar({ currentPage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation('common');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3 border-4 border-yellow-400 relative overflow-hidden">
                <div className="w-full h-6 bg-red-500 absolute top-0"></div>
                <div className="w-full h-1 bg-black absolute top-1/2 transform -translate-y-1/2 z-10"></div>
                <div className="w-5 h-5 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-black z-20"></div>
              </div>
              <span className="text-xl font-bold text-white mr-8">ShortCup</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-auto">
            <Link href="/">
              <span className={`text-white hover:text-yellow-300 font-medium transition ${currentPage === 'home' ? 'text-yellow-300' : ''}`}>
                {t('home')}
              </span>
            </Link>
            <Link href="/tournaments">
              <span className={`text-white hover:text-yellow-300 font-medium transition ${currentPage === 'tournaments' ? 'text-yellow-300' : ''}`}>
                {t('Tournois')}
              </span>
            </Link>
            <Link href="/rules">
              <span className={`text-white hover:text-yellow-300 font-medium transition ${currentPage === 'rules' ? 'text-yellow-300' : ''}`}>
                {t('Règlement')}
              </span>
            </Link>
            
            {/* Dark Mode Toggle */}
            <div className="ml-2">
              <DarkModeToggle />
            </div>
            
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-4">
            {/* Dark Mode Toggle for Mobile */}
            <DarkModeToggle />
            
            <AuthButton />
            <button 
              className="text-white focus:outline-none"
              onClick={toggleMenu}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mt-4 md:hidden">
            <div className="flex flex-col space-y-3 pb-3">
              <Link href="/">
                <span className={`text-white hover:bg-blue-700 py-2 px-4 rounded block ${currentPage === 'home' ? 'bg-blue-700' : ''}`}>
                  {t('home')}
                </span>
              </Link>
              <Link href="/tournament">
                <span className={`text-white hover:bg-blue-700 py-2 px-4 rounded block ${currentPage === 'tournament' ? 'bg-blue-700' : ''}`}>
                  {t('Tournois')}
                </span>
              </Link>
              <Link href="/rules">
                <span className={`text-white hover:bg-blue-700 py-2 px-4 rounded block ${currentPage === 'rules' ? 'bg-blue-700' : ''}`}>
                  {t('Règlement')}
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}