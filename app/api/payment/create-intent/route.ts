import { getAuthToken, verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
	try {
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId } = verifyToken(token)
		const { orderId } = await req.json()

		// Get order details
		const order = await prisma.order.findFirst({
			where: {
				id: orderId,
				userId,
			},
			include: {
				items: {
					include: {
						product: true,
					},
				},
				user: true,
			},
		})

		if (!order) {
			return NextResponse.json({ error: 'Order not found' }, { status: 404 })
		}

		// Check if order is already paid
		if (order.paymentStatus === 'COMPLETED') {
			return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
		}

		// Create or retrieve payment intent
		let paymentIntent

		// Check if payment already exists
		const existingPayment = await prisma.payment.findUnique({
			where: { orderId },
		})

		if (existingPayment && existingPayment.transactionId) {
			// Retrieve existing payment intent
			paymentIntent = await stripe.paymentIntents.retrieve(
				existingPayment.transactionId
			)
		} else {
			// Create new payment intent
			paymentIntent = await stripe.paymentIntents.create({
				amount: Math.round(order.total * 100), // Convert to cents
				currency: 'czk',
				metadata: {
					orderId: order.id,
					orderNumber: order.orderNumber,
					userId: order.userId,
				},
				description: `Order ${order.orderNumber} - Spálená 53 Bookstore`,
				receipt_email: order.user.email,
			})

			// Save payment record
			await prisma.payment.upsert({
				where: { orderId },
				create: {
					orderId,
					transactionId: paymentIntent.id,
					amount: order.total,
					currency: 'CZK',
					status: 'PENDING',
					method: order.paymentMethod,
				},
				update: {
					transactionId: paymentIntent.id,
				},
			})
		}

		return NextResponse.json({
			clientSecret: paymentIntent.client_secret,
			amount: order.total,
			orderNumber: order.orderNumber,
		})
	} catch (error) {
		console.error('Payment intent error:', error)
		return NextResponse.json(
			{ error: 'Failed to create payment intent' },
			{ status: 500 }
		)
	}
}
