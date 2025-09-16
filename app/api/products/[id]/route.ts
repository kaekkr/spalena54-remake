import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params

		const product = await prisma.product.findUnique({
			where: { id },
			include: {
				category: true,
				reviews: {
					include: {
						user: {
							select: {
								firstName: true,
								lastName: true,
							},
						},
					},
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		})

		if (!product) {
			return NextResponse.json({ error: 'Product not found' }, { status: 404 })
		}

		return NextResponse.json(product)
	} catch (error) {
		console.error('Product fetch error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch product' },
			{ status: 500 }
		)
	}
}