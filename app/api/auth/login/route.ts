import { setAuthCookie, signToken } from '@/lib/auth/jwt'
import { comparePassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
	email: z.email(),
	password: z.string(),
})

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const data = loginSchema.parse(body)

		// Find user
		const user = await prisma.user.findUnique({
			where: { email: data.email },
		})

		if (!user) {
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			)
		}

		// Check password
		const isValidPassword = await comparePassword(data.password, user.password)

		if (!isValidPassword) {
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			)
		}

		// Generate token
		const token = signToken({
			userId: user.id,
			email: user.email,
			role: user.role,
		})

		// Set cookie
		await setAuthCookie(token)

		return NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
			},
			token,
			message: 'Login successful',
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.issues },
				{ status: 400 }
			)
		}
		console.error('Login error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
