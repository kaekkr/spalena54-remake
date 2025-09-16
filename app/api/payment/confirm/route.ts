import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Prisma } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
	try {
		const { paymentIntentId } = await req.json()

		// Retrieve payment intent from Stripe
		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

		if (paymentIntent.status !== 'succeeded') {
			return NextResponse.json(
				{ error: 'Payment not successful' },
				{ status: 400 }
			)
		}

		const orderId = paymentIntent.metadata.orderId

		// Update payment and order status
		await prisma.$transaction(async tx => {
			// Update payment
			await tx.payment.update({
				where: { orderId },
				data: {
					status: 'COMPLETED',
					metadata: JSON.parse(JSON.stringify(paymentIntent)) as Prisma.InputJsonValue,
				},
			})

			// Update order
			await tx.order.update({
				where: { id: orderId },
				data: {
					paymentStatus: 'COMPLETED',
					status: 'CONFIRMED',
				},
			})
		})

		// Get updated order
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		return NextResponse.json({
			success: true,
			order,
		})
	} catch (error) {
		console.error('Payment confirmation error:', error)
		return NextResponse.json(
			{ error: 'Failed to confirm payment' },
			{ status: 500 }
		)
	}
}
