import { deliveryService } from '@/lib/services/delivery.service'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const methods = await deliveryService.getDeliveryMethods()
		return NextResponse.json(methods)
	} catch (error) {
		console.error('Delivery methods error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch delivery methods' },
			{ status: 500 }
		)
	}
}
