







/**
 * Authentication State Manager
 * 
 * Simple authentication state management using existing ContextProxy system
 * Provides utilities to check auth status and manage user session state
 */

import { ContextProxy } from '../core/config/ContextProxy';
import { extractUserFromToken, isTokenExpired, getTokenExpiration } from './oacode-token';

export interface AuthState {
	isAuthenticated: boolean;
	user?: {
		userId?: string;
		email?: string;
		plan?: string;
		balance?: number;
		environment?: string;
	};
	token?: string;
	expiresAt?: Date;
	isExpired: boolean;
	error?: string;
}

/**
 * Authentication State Manager
 * 
 * Manages authentication state using existing VSCode storage
 */
export class AuthStateManager {
	private contextProxy: ContextProxy;
	
	constructor(contextProxy: ContextProxy) {
		this.contextProxy = contextProxy;
	}

	/**
	 * Get current authentication state
	 * 
	 * @returns Current auth state with user info and token status
	 */
	async getAuthState(): Promise<AuthState> {
		try {
			// Get token from existing storage
			const token = await this.contextProxy.getValue('oacodeToken') as string;
			
			if (!token) {
				return {
					isAuthenticated: false,
					isExpired: false,
					error: 'No authentication token found'
				};
			}

			// Extract user info from token
			const userInfo = extractUserFromToken(token);
			const expired = isTokenExpired(token);
			const expiration = getTokenExpiration(token);

			// Build auth state
			const authState: AuthState = {
				isAuthenticated: !expired,
				user: userInfo || undefined,
				token,
				expiresAt: expiration || undefined,
				isExpired: expired,
				error: expired ? 'Token expired' : undefined
			};

			return authState;

		} catch (error) {
			console.error('❌ Auth State: Failed to get authentication state:', error);
			return {
				isAuthenticated: false,
				isExpired: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Check if user is currently authenticated
	 * 
	 * @returns True if authenticated with valid token
	 */
	async isAuthenticated(): Promise<boolean> {
		const authState = await this.getAuthState();
		return authState.isAuthenticated;
	}

	/**
	 * Get current user information
	 * 
	 * @returns User info from token or null if not authenticated
	 */
	async getCurrentUser(): Promise<AuthState['user'] | null> {
		const authState = await this.getAuthState();
		return authState.isAuthenticated ? authState.user || null : null;
	}

	/**
	 * Clear authentication data (sign out)
	 */
	async clearAuth(): Promise<void> {
		try {
			console.log('🚪 Auth State: Clearing authentication data');
			await this.contextProxy.setValue('oacodeToken', undefined);
		} catch (error) {
			console.error('❌ Auth State: Failed to clear authentication:', error);
		}
	}

	/**
	 * Check if token needs renewal (expires within threshold)
	 * 
	 * @param thresholdMinutes - Minutes before expiration to consider renewal needed
	 * @returns True if token should be renewed
	 */
	async needsRenewal(thresholdMinutes: number = 60): Promise<boolean> {
		try {
			const authState = await this.getAuthState();
			
			if (!authState.isAuthenticated || !authState.expiresAt) {
				return false;
			}

			const now = new Date();
			const thresholdMs = thresholdMinutes * 60 * 1000;
			const timeUntilExpiry = authState.expiresAt.getTime() - now.getTime();

			return timeUntilExpiry < thresholdMs;

		} catch (error) {
			console.error('❌ Auth State: Failed to check renewal status:', error);
			return false;
		}
	}

	/**
	 * Get time until token expiration
	 * 
	 * @returns Minutes until expiration, or null if no valid token
	 */
	async getTimeUntilExpiration(): Promise<number | null> {
		try {
			const authState = await this.getAuthState();
			
			if (!authState.isAuthenticated || !authState.expiresAt) {
				return null;
			}

			const now = new Date();
			const msUntilExpiry = authState.expiresAt.getTime() - now.getTime();
			
			return Math.max(0, Math.floor(msUntilExpiry / (60 * 1000))); // Convert to minutes

		} catch (error) {
			console.error('❌ Auth State: Failed to get expiration time:', error);
			return null;
		}
	}

	/**
	 * Format user display information
	 * 
	 * @returns Formatted user display string
	 */
	async getUserDisplayInfo(): Promise<string> {
		try {
			const user = await this.getCurrentUser();
			
			if (!user) {
				return 'Not authenticated';
			}

			const email = user.email || 'Unknown user';
			const plan = user.plan || 'unknown plan';
			const balance = user.balance !== undefined ? `$${user.balance}` : 'unknown balance';

			return `${email} (${plan}, ${balance})`;

		} catch (error) {
			console.error('❌ Auth State: Failed to format user info:', error);
			return 'Authentication error';
		}
	}
}

/**
 * Create auth state manager instance
 * 
 * @param contextProxy - VSCode context proxy instance
 * @returns Auth state manager
 */
export function createAuthStateManager(contextProxy: ContextProxy): AuthStateManager {
	return new AuthStateManager(contextProxy);
}