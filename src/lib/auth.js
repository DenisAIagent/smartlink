/**
 * Simple authentication service for SmartLink
 */

export function isAuthenticated() {
	if (typeof window === 'undefined') return false;
	
	const user = localStorage.getItem('smartlink_user');
	if (!user) return false;
	
	try {
		const userData = JSON.parse(user);
		// Vérifier que la session n'est pas expirée (24h)
		const maxAge = 24 * 60 * 60 * 1000; // 24 heures
		return (Date.now() - userData.loggedAt) < maxAge;
	} catch {
		return false;
	}
}

export function getCurrentUser() {
	if (typeof window === 'undefined') return null;
	
	const user = localStorage.getItem('smartlink_user');
	if (!user) return null;
	
	try {
		return JSON.parse(user);
	} catch {
		return null;
	}
}

export function logout() {
	if (typeof window === 'undefined') return;
	localStorage.removeItem('smartlink_user');
}

export function requireAuth(pathname) {
	if (typeof window === 'undefined') return;
	
	if (!isAuthenticated()) {
		window.location.href = '/auth';
		return;
	}
}