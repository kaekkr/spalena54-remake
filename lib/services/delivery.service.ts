// This is a mock service that mimics Czech delivery providers
// Later you can replace with real APIs like Zásilkovna, Czech Post, etc.

export interface DeliveryMethod {
	id: string
	name: string
	provider: string
	price: number
	estimatedDays: number
	description: string
	icon: string
}

export interface DeliveryPoint {
	id: string
	name: string
	address: string
	city: string
	postalCode: string
	openingHours: string
}

export class DeliveryService {
	// Mock delivery methods - matches your database enum
	private methods: DeliveryMethod[] = [
		{
			id: 'PERSONAL_PICKUP',
			name: 'Osobní odběr',
			provider: 'Spálená 53',
			price: 0,
			estimatedDays: 0,
			description: 'Vyzvedněte si objednávku přímo v našem knihkupectví',
			icon: '🏪',
		},
		{
			id: 'CZECH_POST',
			name: 'Česká pošta - Balík do ruky',
			provider: 'Česká pošta',
			price: 89,
			estimatedDays: 2,
			description: 'Doručení na vaši adresu',
			icon: '📮',
		},
		{
			id: 'ZASILKOVNA',
			name: 'Zásilkovna - výdejní místo',
			provider: 'Zásilkovna',
			price: 69,
			estimatedDays: 1,
			description: 'Vyzvednutí na výdejním místě Zásilkovny',
			icon: '📦',
		},
		{
			id: 'PPL',
			name: 'PPL - ParcelShop',
			provider: 'PPL',
			price: 79,
			estimatedDays: 1,
			description: 'Vyzvednutí na výdejním místě PPL',
			icon: '🚚',
		},
		{
			id: 'DPD',
			name: 'DPD - Pickup Point',
			provider: 'DPD',
			price: 85,
			estimatedDays: 2,
			description: 'Vyzvednutí na výdejním místě DPD',
			icon: '📬',
		},
	]

	// Calculate shipping price based on weight and method
	async calculateShipping(weight: number, methodId: string): Promise<number> {
		const method = this.methods.find(m => m.id === methodId)
		if (!method) return 0

		// Add extra cost for heavy items (over 2kg)
		let price = method.price
		if (weight > 2000 && methodId !== 'PERSONAL_PICKUP') {
			price += 30 // Extra 30 Kč for heavy packages
		}

		return price
	}

	// Get all available delivery methods
	async getDeliveryMethods(): Promise<DeliveryMethod[]> {
		// In real implementation, this would check availability based on address
		return this.methods
	}

	// Mock Zásilkovna pickup points - in real app, use their API
	async getZasilkovnaPoints(
		city: string,
		postalCode: string
	): Promise<DeliveryPoint[]> {
		// Mock data - replace with real Zásilkovna API
		return [
			{
				id: 'Z-1234',
				name: 'Zásilkovna - Tesco Národní',
				address: 'Národní 26',
				city: 'Praha 1',
				postalCode: '11000',
				openingHours: 'Po-Pá: 8:00-20:00, So: 9:00-18:00',
			},
			{
				id: 'Z-1235',
				name: 'Zásilkovna - Albert Anděl',
				address: 'Nádražní 23',
				city: 'Praha 5',
				postalCode: '15000',
				openingHours: 'Po-Ne: 7:00-22:00',
			},
			{
				id: 'Z-1236',
				name: 'Zásilkovna - Billa Václavské náměstí',
				address: 'Václavské náměstí 12',
				city: 'Praha 1',
				postalCode: '11000',
				openingHours: 'Po-Pá: 7:00-21:00, So-Ne: 8:00-20:00',
			},
		]
	}

	// Mock PPL pickup points
	async getPPLPoints(
		city: string,
		postalCode: string
	): Promise<DeliveryPoint[]> {
		return [
			{
				id: 'PPL-001',
				name: 'PPL ParcelShop - Hlavní nádraží',
				address: 'Wilsonova 300/8',
				city: 'Praha 2',
				postalCode: '12000',
				openingHours: 'Po-Pá: 6:00-22:00, So-Ne: 7:00-22:00',
			},
			{
				id: 'PPL-002',
				name: 'PPL ParcelShop - Palladium',
				address: 'Náměstí Republiky 1',
				city: 'Praha 1',
				postalCode: '11000',
				openingHours: 'Po-Ne: 9:00-22:00',
			},
		]
	}

	// Create shipment (mock - returns tracking number)
	async createShipment(
		orderId: string,
		method: string,
		address?: any
	): Promise<{
		trackingNumber: string
		label?: string
		pickupCode?: string
	}> {
		// Generate mock tracking number based on provider
		let trackingNumber = ''
		let pickupCode = undefined

		switch (method) {
			case 'CZECH_POST':
				trackingNumber = `CP${Date.now()}CZ`
				break
			case 'ZASILKOVNA':
				trackingNumber = `Z${Date.now()}`
				pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase()
				break
			case 'PPL':
				trackingNumber = `PPL${Date.now()}`
				break
			case 'DPD':
				trackingNumber = `DPD${Date.now()}`
				break
			default:
				trackingNumber = `ORD${Date.now()}`
		}

		return {
			trackingNumber,
			label: `https://mock-labels.com/${trackingNumber}.pdf`,
			pickupCode,
		}
	}

	// Track shipment (mock)
	async trackShipment(trackingNumber: string): Promise<{
		status: string
		location: string
		estimatedDelivery: Date
		events: Array<{
			date: Date
			status: string
			location: string
		}>
	}> {
		return {
			status: 'in_transit',
			location: 'Praha - depo',
			estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
			events: [
				{
					date: new Date(Date.now() - 24 * 60 * 60 * 1000),
					status: 'picked_up',
					location: 'Praha 1 - Spálená',
				},
				{
					date: new Date(),
					status: 'in_transit',
					location: 'Praha - depo',
				},
			],
		}
	}
}

export const deliveryService = new DeliveryService()
