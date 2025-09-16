import { getAuthToken, verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { deliveryService } from '@/lib/services/delivery.service'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createOrderSchema = z.object({
	// Delivery info
	deliveryMethod: z.enum([
		'PERSONAL_PICKUP',
		'CZECH_POST',
		'PPL',
		'DPD',
		'ZASILKOVNA',
	]),
	deliveryPointId: z.string().optional(), // For pickup points

	// Address info (for home delivery)
	address: z
		.object({
			firstName: z.string(),
			lastName: z.string(),
			street: z.string(),
			city: z.string(),
			postalCode: z.string(),
			country: z.string().default('CZ'),
			phone: z.string(),
			email: z.string().email(),
		})
		.optional(),

	// Payment info
	paymentMethod: z.enum([
		'CARD',
		'BANK_TRANSFER',
		'CASH_ON_DELIVERY',
		'PAYPAL',
	]),

	// Optional
	notes: z.string().optional(),
	useExistingAddress: z.boolean().default(false),
	addressId: z.string().optional(),
})

export async function GET(req: NextRequest) {
	try {
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId } = verifyToken(token)

		const orders = await prisma.order.findMany({
			where: { userId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
				address: true,
				payment: true,
			},
			orderBy: { createdAt: 'desc' },
		})

		return NextResponse.json(orders)
	} catch (error) {
		console.error('Orders fetch error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch orders' },
			{ status: 500 }
		)
	}
}

export async function POST(req: NextRequest) {
	try {
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId } = verifyToken(token)
		const body = await req.json()
		console.log('Order body:', body)
		const data = createOrderSchema.parse(body)

		// Get user's cart
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

		if (!cart || cart.items.length === 0) {
			return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
		}

		// Calculate weight for shipping
		const totalWeight = cart.items.reduce(
			(sum, item) => sum + (item.product.weight || 200) * item.quantity,
			0
		)

		// Calculate shipping price
		const deliveryPrice = await deliveryService.calculateShipping(
			totalWeight,
			data.deliveryMethod
		)

		// Handle address
		let addressId: string

		if (data.useExistingAddress && data.addressId) {
			// Use existing address
			addressId = data.addressId
		} else if (data.address) {
			// Create new address
			const newAddress = await prisma.address.create({
				data: {
					userId,
					street: data.address.street,
					city: data.address.city,
					postalCode: data.address.postalCode,
					country: data.address.country,
				},
			})
			addressId = newAddress.id
		} else {
			// Get default address
			const defaultAddress = await prisma.address.findFirst({
				where: { userId, isDefault: true },
			})

			if (!defaultAddress) {
				return NextResponse.json(
					{ error: 'No address provided' },
					{ status: 400 }
				)
			}
			addressId = defaultAddress.id
		}

		// Calculate totals
		let subtotal = 0
		const orderItems = []

		for (const item of cart.items) {
			// Check stock
			if (item.product.stock < item.quantity) {
				return NextResponse.json(
					{ error: `Insufficient stock for ${item.product.title}` },
					{ status: 400 }
				)
			}

			const price = item.product.salePrice || item.product.price
			subtotal += price * item.quantity

			orderItems.push({
				productId: item.productId,
				quantity: item.quantity,
				price: price,
			})
		}

		const total = subtotal + deliveryPrice

		// Generate order number
		const orderCount = await prisma.order.count()
		const orderNumber = `ORD${new Date().getFullYear()}${String(
			orderCount + 1
		).padStart(6, '0')}`

		// Create order in transaction
		const order = await prisma.$transaction(async tx => {
			// Create order
			const newOrder = await tx.order.create({
				data: {
					orderNumber,
					userId,
					addressId,
					paymentMethod: data.paymentMethod,
					deliveryMethod: data.deliveryMethod,
					deliveryPrice,
					subtotal,
					total,
					notes: data.notes,
					status: 'PENDING',
					paymentStatus: 'PENDING',
					items: {
						create: orderItems,
					},
				},
				include: {
					items: {
						include: {
							product: true,
						},
					},
					address: true,
				},
			})

			// Update product stock
			for (const item of orderItems) {
				await tx.product.update({
					where: { id: item.productId },
					data: {
						stock: {
							decrement: item.quantity,
						},
					},
				})
			}

			// Clear cart
			await tx.cartItem.deleteMany({
				where: { cartId: cart.id },
			})

			return newOrder
		})

		// Create shipment (mock)
		const shipment = await deliveryService.createShipment(
			order.id,
			data.deliveryMethod,
			data.address
		)

		// Update order with tracking info
		if (shipment.trackingNumber) {
			await prisma.order.update({
				where: { id: order.id },
				data: {
					deliveryTrackingNumber: shipment.trackingNumber,
				},
			})
		}

		return NextResponse.json({
			order: {
				...order,
				trackingNumber: shipment.trackingNumber,
				pickupCode: shipment.pickupCode,
			},
			message: 'Order created successfully',
		})
	} catch (error) {
		console.error('Order creation error:', error)
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.errors },
				{ status: 400 }
			)
		}
		return NextResponse.json(
			{ error: 'Failed to create order' },
			{ status: 500 }
		)
	}
}
