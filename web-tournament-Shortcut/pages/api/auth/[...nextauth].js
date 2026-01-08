// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { connectToDatabase } from '../../../lib/mongodb';

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: 'identify email' } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the Discord profile info to the token
      if (account && profile) {
        token.id = profile.id;
        token.discord = profile;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client session
      session.user.id = token.id;
      session.user.discord = token.discord;
      
      // Check if user exists in our database and fetch their role
      try {
        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ iduser: token.id });
        
        if (user) {
          session.user.dbUser = user;
          // Vérification explicite du rôle admin
          session.user.isAdmin = user.role === 'admin';
          
          // Ajouter un log pour debug
          console.log(`User ${user.pseudo} (${token.id}) isAdmin: ${session.user.isAdmin}`);
        } else {
          session.user.isAdmin = false;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        session.user.isAdmin = false;
      }
      
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        const { db } = await connectToDatabase();
        
        // Check if user exists in our database
        const existingUser = await db.collection('users').findOne({ iduser: profile.id });
        
        if (!existingUser) {
          // Create a new user in our database
          await db.collection('users').insertOne({
            iduser: profile.id,
            pseudo: profile.username || profile.name || `User${profile.id.slice(0, 6)}`,
            avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
            elo: 1000,
            victories: 0,
            totalMatches: 0,
            winRate: 0,
            rank: 'unranked',
            role: 'user', // Default role
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // Update user's Discord info if it has changed
          const updateObj = {};
          
          if (profile.username && profile.username !== existingUser.pseudo && !existingUser.pseudoCustomized) {
            updateObj.pseudo = profile.username;
          }
          
          if (profile.avatar) {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
            if (avatarUrl !== existingUser.avatar) {
              updateObj.avatar = avatarUrl;
            }
          }
          
          if (Object.keys(updateObj).length > 0) {
            updateObj.updatedAt = new Date();
            await db.collection('users').updateOne(
              { iduser: profile.id },
              { $set: updateObj }
            );
          }
        }
        
        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
  },
  // Configuration pour HTTPS avec Cloudflare Tunnel
  useSecureCookies: true,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true // Cookies uniquement via HTTPS
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);