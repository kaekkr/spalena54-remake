import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, ProductType } from '@prisma/client'

const querySchema = z.object({
	category: z.string().optional(),
	type: z.string().optional(),
	search: z.string().optional(),
	minPrice: z.coerce.number().optional(),
	maxPrice: z.coerce.number().optional(),
	page: z.coerce.number().default(1),
	limit: z.coerce.number().default(20),
	sort: z.enum(['price', '-price', 'title', 'createdAt']).optional(),
})

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const query = querySchema.parse(Object.fromEntries(searchParams))

		const where: Prisma.ProductWhereInput = {
			active: true,
		}

		if (query.category) {
			where.category = { slug: query.category }
		}

		if (query.type) {
			where.type = query.type as ProductType
		}

		if (query.search) {
			where.OR = [
				{ title: { contains: query.search, mode: 'insensitive' } },
				{ author: { contains: query.search, mode: 'insensitive' } },
				{ description: { contains: query.search, mode: 'insensitive' } },
			]
		}

		if (query.minPrice || query.maxPrice) {
			where.price = {}
			if (query.minPrice) where.price.gte = query.minPrice
			if (query.maxPrice) where.price.lte = query.maxPrice
		}

		const orderBy: Prisma.ProductOrderByWithRelationInput = {}
		if (query.sort) {
			const field = query.sort.replace('-', '')
			const order = query.sort.startsWith('-') ? 'desc' : 'asc'
			// Type-safe field assignment
			if (field === 'price') {
				orderBy.price = order
			} else if (field === 'title') {
				orderBy.title = order
			} else if (field === 'createdAt') {
				orderBy.createdAt = order
			} else {
				orderBy.createdAt = order // Default fallback
			}
		} else {
			orderBy.createdAt = 'desc'
		}

		const skip = (query.page - 1) * query.limit

		const [products, total] = await Promise.all([
			prisma.product.findMany({
				where,
				orderBy,
				skip,
				take: query.limit,
				include: {
					category: true,
				},
			}),
			prisma.product.count({ where }),
		])

		return NextResponse.json({
			products,
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				pages: Math.ceil(total / query.limit),
			},
		})
	} catch (error) {
		console.error('Products fetch error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch products' },
			{ status: 500 }
		)
	}
}

// POST route for admin to add products
export async function POST(req: NextRequest) {
	try {
		// TODO: Add admin authentication check
		const body = await req.json()

		const product = await prisma.product.create({
			data: body,
		})

		return NextResponse.json(product, { status: 201 })
	} catch (error) {
		console.error('Product creation error:', error)
		return NextResponse.json(
			{ error: 'Failed to create product' },
			{ status: 500 }
		)
	}
}
