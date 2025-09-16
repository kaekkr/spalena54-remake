import { supabase } from '@/lib/supabase/client'

/**
 * Helper function to get authorization headers for API calls
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
	try {
		const { data: { session } } = await supabase.auth.getSession()

		if (session?.access_token) {
			return {
				'Authorization': `Bearer ${session.access_token}`,
				'Content-Type': 'application/json',
			}
		}

		return {
			'Content-Type': 'application/json',
		}
	} catch (error) {
		console.error('Error getting auth headers:', error)
		return {
			'Content-Type': 'application/json',
		}
	}
}

/**
 * Helper function to make authenticated API calls
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
	const headers = await getAuthHeaders()

	return fetch(url, {
		...options,
		headers: {
			...headers,
			...options.headers,
		},
		credentials: 'include',
	})
}