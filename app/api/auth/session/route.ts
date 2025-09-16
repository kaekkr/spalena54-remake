import { prisma } from '@/lib/db/prisma'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client for server-side
const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
	try {
		// Get the authorization header
		const authHeader = req.headers.get('authorization')

		if (!authHeader) {
			return NextResponse.json(
				{ error: 'No authorization header' },
				{ status: 401 }
			)
		}

		// Extract the token
		const token = authHeader.replace('Bearer ', '')

		// Get user from Supabase
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token)

		if (error || !user) {
			return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
		}

		// Get user details from your database
		const dbUser = await prisma.user.findUnique({
			where: {
				email: user.email!,
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				phone: true,
				role: true,
				addresses: {
					select: {
						id: true,
						street: true,
						city: true,
						postalCode: true,
						country: true,
						isDefault: true,
					},
				},
			},
		})

		if (!dbUser) {
			// User exists in Supabase but not in your database
			// This can happen with OAuth logins - create the user
			const newUser = await prisma.user.create({
				data: {
					id: user.id,
					email: user.email!,
					firstName:
						user.user_metadata?.first_name ||
						user.user_metadata?.given_name ||
						'User',
					lastName:
						user.user_metadata?.last_name ||
						user.user_metadata?.family_name ||
						'',
					password: 'oauth_user', // Placeholder for OAuth users
					role: 'CUSTOMER',
					emailVerified: true,
					cart: {
						create: {},
					},
				},
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					phone: true,
					role: true,
					addresses: true,
				},
			})

			return NextResponse.json({
				user: newUser,
				isAuthenticated: true,
			})
		}

		return NextResponse.json({
			user: dbUser,
			isAuthenticated: true,
		})
	} catch (error) {
		console.error('Session error:', error)
		return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
	}
}
