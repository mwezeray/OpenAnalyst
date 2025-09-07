export function getOaCodeBackendSignInUrl(uriScheme: string = "vscode", uiKind: string = "Desktop") {
	const baseUrl = "https://app.openanalyst.com"
	const source = uiKind === "Web" ? "extension" : "extension"  // Use "extension" for LibreChat integration
	return `${baseUrl}/login?source=${source}`
}

export function getOaCodeBackendSignUpUrl(uriScheme: string = "vscode", uiKind: string = "Desktop") {
	const baseUrl = "https://app.openanalyst.com"
	const source = uiKind === "Web" ? "extension" : "extension"  // Use "extension" for LibreChat integration
	return `${baseUrl}/register?source=${source}`
}
