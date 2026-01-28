import { invoke } from '@tauri-apps/api/core';

export const Security = {
    /**
     * Save a secret to the System Keychain (hardware backed).
     * @param key The identifier for the secret (e.g. 'openai_api_key')
     * @param value The secret value
     */
    saveSecret: async (key: string, value: string): Promise<void> => {
        try {
            await invoke('save_secret', { key, value });
        } catch (e) {
            console.error("Failed to save secret to Keychain:", e);
            throw e;
        }
    },

    /**
     * Retrieve a secret from the System Keychain.
     * @param key The identifier to look up
     * @returns The secret string, or null if not found/error
     */
    getSecret: async (key: string): Promise<string | null> => {
        try {
            return await invoke('get_secret', { key });
        } catch (e) {
            // It's normal to not find a key (e.g. first run)
            console.debug(`Secret '${key}' not found in Keychain.`);
            return null;
        }
    },

    /**
     * Delete a secret from the System Keychain.
     * @param key The identifier to delete
     */
    deleteSecret: async (key: string): Promise<void> => {
        try {
            await invoke('delete_secret', { key });
        } catch (e) {
            console.error("Failed to delete secret:", e);
        }
    }
};
