// pages/rules.js
import React from 'react';
import Layout from '../components/layout/Layout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { AlertCircle, Calendar, Users, Trophy, Shield, Zap, Clock, FileText, Download } from 'lucide-react';

export default function Rules() {
  const { t } = useTranslation(['common', 'rules']);
  
  return (
    <Layout title="Règlement du Tournoi Pokémon Pocket">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6 bg-gradient-to-r from-[#009898] to-[#006C4C] text-white">
            <h1 className="text-3xl font-bold mb-2">Règlement Officiel</h1>
            <p className="text-green-100">
              Tournoi Pokémon Pocket - Événement Shortcut du Crédit Agricole
            </p>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Contenu principal */}
              <div className="w-full md:w-2/3 prose max-w-none">
                <h2>Règlement du tournoi Pokémon Pocket</h2>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 not-prose mb-6">
                  <div className="flex">
                    <AlertCircle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-yellow-800">Important</h3>
                      <p className="text-yellow-700">
                        En participant à ce tournoi, vous acceptez de respecter l'ensemble des règles détaillées ci-dessous.
                      </p>
                    </div>
                  </div>
                </div>
                
                <h3>Éligibilité des participants</h3>
                <ul>
                  <li>Le tournoi est ouvert à tous les membres du serveur Discord Shortcut du Crédit Agricole.</li>
                  <li>Les participants doivent s'inscrire via le salon <code>"event-tournoi-pokémon-tcg-pocket"</code> avant le 7 juin 2025 à 23h59 (heure de Paris).</li>
                  <li>Les participants doivent posséder le jeu Pokémon Pocket et avoir un compte actif.</li>
                  <li>Les participants doivent être disponibles aux dates du tournoi (7 et 8 juin 2025).</li>
                </ul>

                <h3>Format du tournoi</h3>
                <ul>
                  <li><strong>Phase éliminatoire</strong> : 16e et 8e de finale en BO1, quarts et demi-finales en BO3, finale en BO3 également.</li>
                  <li>Le tableau de la phase éliminatoire sera généré aléatoirement.</li>
                </ul>

                <h3>Règles des matchs</h3>
                <ul>
                  <li>Format de combat: Single Battle (1v1)</li>
                  <li>aucune restriction de pokémon</li>
                  <li>L'utilisation d'outils externes ou de modification de données est strictement interdite.</li>
                </ul>

                <h3>Déroulement des matchs</h3>
                <ul>
                  <li>Les joueurs seront contactés via Discord pour organiser leurs matchs.</li>
                  <li>Les joueurs doivent se joindre dans le jeu en utilisant le code fourni par l'organisateur.</li>
                  <li>Les résultats doivent être rapportés dans le canal Discord dédié après chaque match.</li>
                  <li>En cas de déconnexion, le match sera rejoué.</li>
                  <li>Un délai maximum de 20 min est accordé pour jouer chaque match prévu. Au-delà, le joueur non répondant sera considéré comme forfait (svp prévenez avant 🙏).</li>
                </ul>

                <h3>Code de conduite</h3>
                <ul>
                  <li>Les participants sont tenus de faire preuve de sportivité et de respect envers les autres joueurs.</li>
                  <li>Toute forme de triche, d'abus ou de comportement antisportif entraînera une disqualification immédiate.</li>
                  <li>Les décisions des organisateurs sont définitives et sans appel.</li>
                </ul>

                <h3>Récompenses</h3>
                <p>Les récompenses seront distribuées selon le classement final:</p>
                <ul>
                  <li><strong>1ère place</strong>: 50€ de carte cadeau</li>
                  <li><strong>2ème place</strong>: 30€ de carte cadeau</li>
                  <li><strong>3ème place</strong>: 20€ de carte cadeau</li>
                  <li><strong>4ème à 8ème et 8ème à 16 ème place</strong>: 10€ et 5€ de carte cadeau</li>
                </ul>

                <h3>Diffusion et droits à l'image</h3>
                <ul>
                  <li>Les matchs des phases finales serront difusé sur la chaîne Twitch des streamer pour cet évenement, ils vous serra demander de faire un partage d'écran de votre pov.</li>
                </ul>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 not-prose mt-6">
                  <p className="text-blue-700">
                    Les organisateurs se réservent le droit de modifier ce règlement en cas de besoin.
                  </p>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="w-full md:w-1/3">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Informations clés</h3>
                  <ul className="space-y-4">
                    <li className="flex items-center">
                      <Calendar className="h-5 w-5 text-[#009898] mr-3" />
                      <div>
                        <span className="block font-medium">Dates du tournoi</span>
                        <span className="text-gray-600">7 et 8 juin 2025</span>
                      </div>
                    </li>
                    <li className="flex items-center">
                      <Clock className="h-5 w-5 text-[#009898] mr-3" />
                      <div>
                        <span className="block font-medium">Fin des inscriptions</span>
                        <span className="text-gray-600">7 juin 2025</span>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#009898]/10 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-[#009898] mb-4">Comment participer</h3>
                  <ol className="space-y-4 list-decimal list-inside text-gray-700">
                    <li>Rejoignez le serveur Discord Shortcut</li>
                    <li>allez dans le salon <code className="bg-gray-100 px-1 rounded">event-tournoi-pokémon-tcg-pocket</code></li>
                    <li>cliquez sur le bouton</li>
                    <li>Préparez votre équipe pour le tournoi</li>
                  </ol>
                  <div className="mt-4">
                    <a 
                      href="https://discord.gg/Shortcut" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#009898] text-white rounded hover:bg-[#006C4C] transition"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Rejoindre Discord
                    </a>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Téléchargements</h3>
                  <ul className="space-y-3">
                    <li>
<a 
  href="https://drive.google.com/file/d/1XLu4RLY-bZJxPBWJJacE5rkUZBgMinfd/view" 
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-100 transition"
>
  <FileText className="h-5 w-5 text-blue-500 mr-3" />
  <div>
    <span className="block font-medium">Règlement complet (PDF)</span>
  </div>
  <Download className="h-4 w-4 ml-auto text-gray-400" />
</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              <Link href="/">
                <button className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition">
                  Retour à l'accueil
                </button>
              </Link>
              
              <Link href="/tournaments">
                <button className="px-6 py-2 bg-[#009898] text-white rounded hover:bg-[#006C4C] transition">
                  Voir les détails du tournoi
                </button>
              </Link>
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
      ...(await serverSideTranslations(locale, ['common', 'rules'])),
    },
  };
}