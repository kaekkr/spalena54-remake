import { getAuthToken, verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
	try {
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId } = verifyToken(token)

		const cart = await prisma.cart.findUnique({
			where: { userId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		return NextResponse.json(cart || { items: [] })
	} catch (error) {
		console.error('Cart fetch error:', error)
		return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
	}
}

export async function POST(req: NextRequest) {
	try {
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId } = verifyToken(token)
		const { productId, quantity = 1 } = await req.json()

		// Validate product exists and has stock
		const product = await prisma.product.findUnique({
			where: { id: productId },
		})

		if (!product) {
			return NextResponse.json({ error: 'Product not found' }, { status: 404 })
		}

		if (product.stock < quantity) {
			return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
		}

		// Get or create cart
		let cart = await prisma.cart.findUnique({
			where: { userId },
		})

		if (!cart) {
			cart = await prisma.cart.create({
				data: { userId },
			})
		}

		// Check if item exists in cart
		const existingItem = await prisma.cartItem.findUnique({
			where: {
				cartId_productId: {
					cartId: cart.id,
					productId,
				},
			},
		})

		if (existingItem) {
			// Update quantity
			await prisma.cartItem.update({
				where: { id: existingItem.id },
				data: { quantity: existingItem.quantity + quantity },
			})
		} else {
			// Add new item
			await prisma.cartItem.create({
				data: {
					cartId: cart.id,
					productId,
					quantity,
				},
			})
		}

		// Return updated cart
		const updatedCart = await prisma.cart.findUnique({
			where: { id: cart.id },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		return NextResponse.json(updatedCart)
	} catch (error) {
		console.error('Add to cart error:', error)
		return NextResponse.json(
			{ error: 'Failed to add to cart' },
			{ status: 500 }
		)
	}
}

// DELETE route to clear cart
export async function DELETE(req: NextRequest) {
	try {
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId } = verifyToken(token)

		const cart = await prisma.cart.findUnique({
			where: { userId },
		})

		if (!cart) {
			return NextResponse.json({ message: 'Cart already empty' })
		}

		// Delete all cart items
		await prisma.cartItem.deleteMany({
			where: { cartId: cart.id },
		})

		return NextResponse.json({ message: 'Cart cleared successfully' })
	} catch (error) {
		console.error('Clear cart error:', error)
		return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
	}
}
