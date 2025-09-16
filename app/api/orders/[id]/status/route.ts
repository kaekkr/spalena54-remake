import { getAuthToken, verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const token = await getAuthToken()
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId } = verifyToken(token)
		const { paymentStatus, status } = await req.json()

		// Verify order belongs to user
		const order = await prisma.order.findFirst({
			where: {
				id: params.id,
				userId,
			},
		})

		if (!order) {
			return NextResponse.json({ error: 'Order not found' }, { status: 404 })
		}

		// Update order
		const updatedOrder = await prisma.order.update({
			where: { id: params.id },
			data: {
				...(paymentStatus && { paymentStatus }),
				...(status && { status }),
			},
		})

		// If payment is completed, create/update payment record
		if (paymentStatus === 'COMPLETED') {
			await prisma.payment.upsert({
				where: { orderId: params.id },
				create: {
					orderId: params.id,
					amount: order.total,
					currency: 'CZK',
					status: 'COMPLETED',
					method: order.paymentMethod,
				},
				update: {
					status: 'COMPLETED',
				},
			})
		}

		return NextResponse.json(updatedOrder)
	} catch (error) {
		console.error('Order status update error:', error)
		return NextResponse.json(
			{ error: 'Failed to update order status' },
			{ status: 500 }
		)
	}
}
