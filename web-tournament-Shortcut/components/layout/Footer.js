import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-gradient-to-r from-blue-800 to-blue-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-2 border-2 border-yellow-400 relative overflow-hidden">
                <div className="w-full h-5 bg-red-500 absolute top-0"></div>
                <div className="w-full h-0.5 bg-black absolute top-1/2 transform -translate-y-1/2 z-10"></div>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-black z-20"></div>
              </div>
              <span className="font-bold">ShortCup</span>
            </div>
            <p className="text-sm text-blue-200">
              Tournoi Pokemon Pocket organisé par Shortcut
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('navigation')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-blue-200 hover:text-white transition">{t('home')}</span>
                </Link>
              </li>
              <li>
                <Link href="/rules">
                  <span className="text-blue-200 hover:text-white transition">{t('règlement')}</span>
                </Link>
              </li>
              <li>
                <Link href="/tournaments">
                  <span className="text-blue-200 hover:text-white transition">{t('tournoi')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Shortcut */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('Shortcut')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://discord.gg/Shortcut" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white transition">
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-blue-700 text-center text-sm text-blue-300">
          <p>&copy; {new Date().getFullYear()} Pocketex. {t('all_rights_reserved')}</p>
          <p className="mt-2">{t('made_with_love')} Icare</p>
        </div>
      </div>
    </footer>
  );
}