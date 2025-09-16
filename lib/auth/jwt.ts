import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
	userId: string
	email: string
	role: string
}

export const signToken = (payload: JWTPayload): string => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return jwt.sign(payload as any, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN } as any)
}

export const verifyToken = (token: string): JWTPayload => {
	return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export const setAuthCookie = async (token: string) => {
	const cookieStore = await cookies()
	cookieStore.set('auth-token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7, // 7 days
		path: '/',
	})
}

export const getAuthToken = async (): Promise<string | undefined> => {
	const cookieStore = await cookies()
	return cookieStore.get('auth-token')?.value
}

export const clearAuthCookie = async () => {
	const cookieStore = await cookies()
	cookieStore.delete('auth-token')
}
