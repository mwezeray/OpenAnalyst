/**
 * Enhanced OACode Token Utilities
 * 
 * Handles JWT token decoding for both legacy and new authentication systems.
 * Maintains backward compatibility while supporting enhanced user data extraction.
 */

// Enhanced token payload interface for new JWT structure
export interface OACodeTokenPayload {
	// Legacy fields (for backward compatibility)
	env?: 'development' | 'production';
	
	// New JWT structure fields
	userId: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	environment?: 'development' | 'production';
	balance?: number;
	plan?: 'free' | 'pro' | 'enterprise';
	permissions?: string[];
	dailyTokenLimit?: number;
	monthlyTokenLimit?: number;
	dailyRequestLimit?: number;
	monthlyRequestLimit?: number;
	lastLoginAt?: number;
	createdAt?: number;
	
	// Standard JWT fields
	iat?: number;
	exp?: number;
	iss?: string;
}

/**
 * Extract and decode JWT payload from OACode token
 * 
 * @param oacodeToken - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeOACodeTokenPayload(oacodeToken: string): OACodeTokenPayload | null {
	try {
		const payload_string = oacodeToken.split(".")[1]
		if (!payload_string) {
			console.warn("Invalid OACode token format")
			return null
		}
		
		const payload = JSON.parse(Buffer.from(payload_string, "base64").toString())
		return payload as OACodeTokenPayload
	} catch (error) {
		console.warn("Failed to decode OACode token payload:", error)
		return null
	}
}

/**
 * Get base URI from OACode token (legacy function - maintained for compatibility)
 * 
 * @param oacodeToken - JWT token string
 * @returns Base URI for API calls
 */
export function getoaBaseUriFromToken(oacodeToken: string) {
	try {
		const payload = decodeOACodeTokenPayload(oacodeToken)
		if (!payload) {
			return "https://app.openanalyst.com"
		}
		
		//note: this is UNTRUSTED, so we need to make sure we're OK with this being manipulated by an attacker; e.g. we should not read uri's from the JWT directly.
		
		// Check new 'environment' field first, then fall back to legacy 'env' field
		const environment = payload.environment || payload.env
		if (environment === "development") {
			return "https://app.openanalyst.com"
		}
	} catch (_error) {
		console.warn("Failed to get base URL from OpenAnalyst token")
	}
	return "https://app.openanalyst.com"
}

/**
 * Extract user information from OACode token
 * 
 * @param oacodeToken - JWT token string
 * @returns User information or null if unavailable
 */
export function extractUserFromToken(oacodeToken: string): {
	userId?: string;
	email?: string;
	firstName?: string | null;
	lastName?: string | null;
	plan?: string;
	balance?: number;
	environment?: string;
} | null {
	try {
		const payload = decodeOACodeTokenPayload(oacodeToken)
		if (!payload) {
			return null
		}
		
		return {
			userId: payload.userId,
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
			plan: payload.plan,
			balance: payload.balance,
			environment: payload.environment || payload.env
		}
	} catch (error) {
		console.warn("Failed to extract user from OACode token:", error)
		return null
	}
}

/**
 * Check if OACode token is expired
 * 
 * @param oacodeToken - JWT token string
 * @returns True if expired, false if valid or unable to determine
 */
export function isTokenExpired(oacodeToken: string): boolean {
	try {
		const payload = decodeOACodeTokenPayload(oacodeToken)
		if (!payload || !payload.exp) {
			// If no expiration time, assume it's valid (legacy tokens)
			return false
		}
		
		const now = Math.floor(Date.now() / 1000)
		return payload.exp < now
	} catch (error) {
		console.warn("Failed to check token expiration:", error)
		// If we can't determine, assume it's expired for safety
		return true
	}
}

/**
 * Get token expiration time as Date object
 * 
 * @param oacodeToken - JWT token string
 * @returns Expiration date or null if unavailable
 */
export function getTokenExpiration(oacodeToken: string): Date | null {
	try {
		const payload = decodeOACodeTokenPayload(oacodeToken)
		if (!payload || !payload.exp) {
			return null
		}
		
		return new Date(payload.exp * 1000)
	} catch (error) {
		console.warn("Failed to get token expiration:", error)
		return null
	}
}

/**
 * Get user plan limits from token
 * 
 * @param oacodeToken - JWT token string
 * @returns Plan limits or null if unavailable
 */
export function getPlanLimitsFromToken(oacodeToken: string): {
	dailyTokenLimit?: number;
	monthlyTokenLimit?: number;
	dailyRequestLimit?: number;
	monthlyRequestLimit?: number;
} | null {
	try {
		const payload = decodeOACodeTokenPayload(oacodeToken)
		if (!payload) {
			return null
		}
		
		return {
			dailyTokenLimit: payload.dailyTokenLimit,
			monthlyTokenLimit: payload.monthlyTokenLimit,
			dailyRequestLimit: payload.dailyRequestLimit,
			monthlyRequestLimit: payload.monthlyRequestLimit
		}
	} catch (error) {
		console.warn("Failed to get plan limits from token:", error)
		return null
	}
}
