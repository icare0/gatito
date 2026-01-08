// utils/SafeDiscordUtils.js - Utilitaires sécurisés pour Discord
class SafeDiscordUtils {
    
    /**
     * Récupère un utilisateur de façon sécurisée
     * @param {Client} client - Client Discord
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<{success: boolean, user?: User, error?: string}>}
     */
    static async safeUserFetch(client, userId) {
        try {
            if (!userId || typeof userId !== 'string') {
                return { success: false, error: 'Invalid user ID provided' };
            }
            
            // D'abord essayer le cache
            const cachedUser = client.users.cache.get(userId);
            if (cachedUser) {
                return { success: true, user: cachedUser };
            }
            
            // Essayer de fetch avec timeout
            const user = await Promise.race([
                client.users.fetch(userId),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Fetch timeout')), 5000)
                )
            ]);
            
            return { success: true, user };
            
        } catch (error) {
            console.error(`❌ Failed to fetch user ${userId}:`, error.message);
            
            // Retourner un utilisateur "fantôme" pour continuer le processus
            return { 
                success: false, 
                error: error.message,
                ghostUser: {
                    id: userId,
                    username: 'Utilisateur Inconnu',
                    tag: 'Utilisateur Inconnu#0000',
                    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
                }
            };
        }
    }

    /**
     * Récupère plusieurs utilisateurs de façon sécurisée
     * @param {Client} client - Client Discord
     * @param {string[]} userIds - IDs des utilisateurs
     * @returns {Promise<{success: boolean, users: Map<string, User>, errors: string[]}>}
     */
    static async safeBulkUserFetch(client, userIds) {
        const users = new Map();
        const errors = [];
        
        const fetchPromises = userIds.map(async (userId) => {
            const result = await this.safeUserFetch(client, userId);
            if (result.success) {
                users.set(userId, result.user);
            } else {
                errors.push(`User ${userId}: ${result.error}`);
                // Utiliser le ghostUser si disponible
                if (result.ghostUser) {
                    users.set(userId, result.ghostUser);
                }
            }
        });
        
        await Promise.allSettled(fetchPromises);
        
        return {
            success: errors.length === 0,
            users,
            errors
        };
    }

    /**
     * Envoie un message en gérant les erreurs
     * @param {TextChannel|DMChannel|ThreadChannel} channel - Channel de destination
     * @param {MessageOptions} options - Options du message
     * @returns {Promise<{success: boolean, message?: Message, error?: string}>}
     */
    static async safeSendMessage(channel, options) {
        try {
            const message = await channel.send(options);
            return { success: true, message };
        } catch (error) {
            console.error(`❌ Failed to send message to ${channel.id}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Crée un thread de façon sécurisée
     * @param {TextChannel} channel - Channel parent
     * @param {ThreadCreateOptions} options - Options du thread
     * @returns {Promise<{success: boolean, thread?: ThreadChannel, error?: string}>}
     */
    static async safeThreadCreate(channel, options) {
        try {
            const thread = await channel.threads.create(options);
            return { success: true, thread };
        } catch (error) {
            console.error(`❌ Failed to create thread in ${channel.id}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envoie un DM de façon sécurisée
     * @param {User} user - Utilisateur destinataire
     * @param {MessageOptions} options - Options du message
     * @returns {Promise<{success: boolean, message?: Message, error?: string}>}
     */
    static async safeDM(user, options) {
        try {
            const dmChannel = await user.createDM();
            const message = await dmChannel.send(options);
            return { success: true, message };
        } catch (error) {
            console.error(`❌ Failed to send DM to ${user.id}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Valide un ID Discord
     * @param {string} id - ID à valider
     * @returns {boolean}
     */
    static isValidDiscordId(id) {
        return typeof id === 'string' && /^\d{17,19}$/.test(id);
    }

    /**
     * Génère un nom d'utilisateur de secours
     * @param {string} userId - ID de l'utilisateur
     * @returns {string}
     */
    static generateFallbackUsername(userId) {
        return `Utilisateur_${userId.slice(-4)}`;
    }
}

module.exports = SafeDiscordUtils;