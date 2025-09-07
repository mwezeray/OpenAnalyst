import * as vscode from "vscode"

import { CloudService } from "@roo-code/cloud"

import { ClineProvider } from "../core/webview/ClineProvider"

export const handleUri = async (uri: vscode.Uri) => {
	const path = uri.path
	const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
	const visibleProvider = ClineProvider.getVisibleInstance()

	if (!visibleProvider) {
		return
	}

	switch (path) {
		case "/glama": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleGlamaCallback(code)
			}
			break
		}
		case "/openrouter": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleOpenRouterCallback(code)
			}
			break
		}
		case "/oacode": {
			const token = query.get("token")
			if (token) {
				await visibleProvider.handleOaCodeCallback(token)
			}
			break
		}
		case "/auth-callback": {
			// Enhanced authentication callback for new JWT tokens
			const data = query.get("data")
			const token = query.get("token") // Fallback for direct token parameter
			
			if (data) {
				// New format: structured callback data from Phase 2 frontend
				try {
					const callbackData = JSON.parse(decodeURIComponent(data))
					await visibleProvider.handleEnhancedOaCodeCallback(callbackData)
				} catch (error) {
					console.error('Failed to parse authentication callback data:', error)
					// Fallback to basic token handling if data parsing fails
					if (token) {
						await visibleProvider.handleOaCodeCallback(token)
					}
				}
			} else if (token) {
				// Fallback: direct token parameter (legacy support)
				await visibleProvider.handleOaCodeCallback(token)
			}
			break
		}
		// oacode_change start
		case "/oacode/profile": {
			await visibleProvider.postMessageToWebview({
				type: "action",
				action: "profileButtonClicked",
			})
			await visibleProvider.postMessageToWebview({
				type: "updateProfileData",
			})
			break
		}
		// oacode_change end
		case "/requesty": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleRequestyCallback(code)
			}
			break
		}
		case "/auth/clerk/callback": {
			const code = query.get("code")
			const state = query.get("state")
			const organizationId = query.get("organizationId")

			await CloudService.instance.handleAuthCallback(
				code,
				state,
				organizationId === "null" ? null : organizationId,
			)
			break
		}
		default:
			break
	}
}
