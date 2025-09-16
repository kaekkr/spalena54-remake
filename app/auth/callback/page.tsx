'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

export default function AuthCallbackPage() {
	const router = useRouter()

	useEffect(() => {
		const handleCallback = async () => {
			// Get the session from the URL hash
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession()

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

	const syncUserWithDatabase = async (user: User) => {
		try {
			// First check if user exists using raw SQL to bypass RLS
			const { data: existingUser } = await supabase.rpc('get_or_create_user', {
				p_user_id: user.id,
				p_email: user.email,
				p_first_name:
					user.user_metadata?.given_name ||
					user.user_metadata?.full_name?.split(' ')[0] ||
					'User',
				p_last_name:
					user.user_metadata?.family_name ||
					user.user_metadata?.full_name?.split(' ')[1] ||
					'',
			})

			console.log('User synced:', existingUser)
		} catch (error) {
			console.error('Error syncing user:', error)
			// Even if sync fails, continue - user can still use the app
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center'>
			<div className='text-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
				<p className='mt-4 text-gray-600'>Signing you in...</p>
			</div>
		</div>
	)
}
