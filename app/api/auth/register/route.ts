import { setAuthCookie, signToken } from '@/lib/auth/jwt'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
	email: z.email(),
	password: z.string().min(6),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const data = registerSchema.parse(body)

		// Check if user exists
		const existing = await prisma.user.findUnique({
			where: { email: data.email },
		})

		if (existing) {
			return NextResponse.json(
				{ error: 'User already exists' },
				{ status: 400 }
			)
		}

		// Create user
		const hashedPassword = await hashPassword(data.password)
		const user = await prisma.user.create({
			data: {
				...data,
				password: hashedPassword,
				cart: {
					create: {}, // Create empty cart
				},
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
			},
		})

		// Generate token
		const token = signToken({
			userId: user.id,
			email: user.email,
			role: user.role,
		})

		// Set cookie
		await setAuthCookie(token)

		return NextResponse.json({
			user,
			token,
			message: 'Registration successful',
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.errors },
				{ status: 400 }
			)
		}
		console.error('Registration error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
