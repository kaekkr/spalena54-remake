'use client'

import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthCallbackPage() {
	const router = useRouter()

	useEffect(() => {
		const handleCallback = async () => {
			// Get the session from the URL hash
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession()

			console.log('Session:', session)

			if (error) {
				console.error('Error during auth callback:', error)
				router.push('/auth/login')
				return
			}

			if (session) {
				// Sync user with your database
				await syncUserWithDatabase(session.user)
				// Redirect to home or intended page
				router.push('/')
			} else {
				router.push('/auth/login')
			}
		}

		handleCallback()
	}, [router])

	const syncUserWithDatabase = async (_user: User) => {
		try {
			// Get the current session token to pass to our API
			const { data: { session } } = await supabase.auth.getSession()

			if (!session?.access_token) {
				console.error('No access token available')
				return
			}

			// Call our session API which will create/sync the user automatically
			const response = await fetch('/api/auth/session', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${session.access_token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			})

			if (response.ok) {
				const data = await response.json()
				console.log('User synced:', data.user)
			} else {
				console.error('Failed to sync user:', await response.text())
			}
		} catch (error) {
			console.error('Error syncing user:', error)
			// Even if sync fails, continue - user can still use the app
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50'>
			<div className='text-center bg-white p-8 rounded-lg shadow-md'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
				<p className='mt-4 text-gray-900 font-medium'>Signing you in...</p>
				<p className='mt-2 text-gray-700 text-sm'>Please wait while we authenticate you</p>
			</div>
		</div>
	)
}
