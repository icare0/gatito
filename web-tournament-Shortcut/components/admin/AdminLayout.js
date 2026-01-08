// components/admin/AdminLayout.js
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home, 
  BarChart2, 
  MessageSquare, 
  FileText, 
  Users, 
  Award,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import LoadingScreen from '../shared/LoadingScreen';
import AccessDenied from './AccessDenied'; // Importation de notre page d'accès refusé

export default function AdminLayout({ children, title }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check if user is authenticated and has admin role
  if (status === 'loading') {
    return <LoadingScreen />;
  }
  
  // Redirection vers la page d'accès refusé si l'utilisateur n'est pas admin
  if (status === 'unauthenticated' || !session || !session.user.isAdmin) {
    // On ne redirige plus, on affiche directement notre page d'accès refusé
    return <AccessDenied />;
  }
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home, current: router.pathname === '/admin' },
    { name: 'Statistiques', href: '/admin/statistics', icon: BarChart2, current: router.pathname === '/admin/statistics' },
    { name: 'Actualités', href: '/admin/announcements', icon: MessageSquare, current: router.pathname === '/admin/announcements' },
    { name: 'Changelogs', href: '/admin/changelogs', icon: FileText, current: router.pathname === '/admin/changelogs' },
    { name: 'Utilisateurs', href: '/admin/users', icon: Users, current: router.pathname === '/admin/users' },
    { name: 'Clans', href: '/admin/clans', icon: Award, current: router.pathname === '/admin/clans' },
    { name: 'Paramètres', href: '/admin/settings', icon: Settings, current: router.pathname === '/admin/settings' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="lg:hidden fixed inset-0 z-40 flex pointer-events-none">
        <div 
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-in-out duration-300 pointer-events-auto ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`} 
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-blue-800 transition ease-in-out duration-300 transform pointer-events-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Fermer menu</span>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Sidebar content */}
          <div className="flex-shrink-0 flex items-center px-4">
            <span className="font-bold text-xl text-white">Admin Pocketex</span>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      item.current
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-6 w-6 text-blue-300" aria-hidden="true" />
                    {item.name}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-blue-700 p-4">
            <div className="flex-shrink-0 group block">
              <div className="flex items-center">
                <div>
                  <Image
                    className="inline-block h-10 w-10 rounded-full"
                    src={session?.user?.image || session?.user?.avatar || "/images/default-avatar.png"}
                    alt=""
                    width={40}
                    height={40}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">
                    {session?.user?.name || session?.user?.dbUser?.pseudo}
                  </p>
                  <p className="text-sm font-medium text-blue-200 group-hover:text-blue-100">
                    Admin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-blue-800">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-900">
            <span className="font-bold text-xl text-white">Admin Pocketex</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5 text-blue-300" aria-hidden="true" />
                    {item.name}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-blue-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <Image
                    className="inline-block h-9 w-9 rounded-full"
                    src={session?.user?.image || session?.user?.avatar || "/images/default-avatar.png"}
                    alt=""
                    width={36}
                    height={36}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {session?.user?.name || session?.user?.dbUser?.pseudo}
                  </p>
                  <Link href="/" className="text-xs font-medium text-blue-200 group-hover:text-blue-100">
                    Retour au site
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Ouvrir le menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-semibold text-gray-800 self-center">{title}</h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <Link
                href="/"
                className="bg-blue-600 p-1 rounded-full text-white hover:bg-blue-700 focus:outline-none"
              >
                <span className="sr-only">Retour au site</span>
                <Home className="h-6 w-6" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
        
        <main className="flex-1 pb-8">
          <div className="mt-8 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}