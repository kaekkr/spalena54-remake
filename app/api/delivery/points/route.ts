import { deliveryService } from '@/lib/services/delivery.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const provider = searchParams.get('provider')
		const city = searchParams.get('city') || 'Praha'
		const postalCode = searchParams.get('postalCode') || '11000'

		let points = []

		switch (provider) {
			case 'ZASILKOVNA':
				points = await deliveryService.getZasilkovnaPoints(city, postalCode)
				break
			case 'PPL':
				points = await deliveryService.getPPLPoints(city, postalCode)
				break
			default:
				return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
		}

		return NextResponse.json(points)
	} catch (error) {
		console.error('Delivery points error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch delivery points' },
			{ status: 500 }
		)
	}
}
