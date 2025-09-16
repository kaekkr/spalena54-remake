import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
	// Create categories
	const fiction = await prisma.category.create({
		data: {
			name: 'Fiction',
			slug: 'fiction',
			description: 'Fiction books',
		},
	})

	const nonFiction = await prisma.category.create({
		data: {
			name: 'Non-Fiction',
			slug: 'non-fiction',
			description: 'Non-fiction books',
		},
	})

	const vinyl = await prisma.category.create({
		data: {
			name: 'Vinyl Records',
			slug: 'vinyl',
			description: 'Vinyl records and LPs',
		},
	})

	const antiquarian = await prisma.category.create({
		data: {
			name: 'Antiquarian',
			slug: 'antiquarian',
			description: 'Rare and antique books',
		},
	})

	// Create test admin user
	const adminPassword = await bcrypt.hash('admin123', 12)
	await prisma.user.create({
		data: {
			email: 'admin@spalena53.cz',
			password: adminPassword,
			firstName: 'Admin',
			lastName: 'User',
			role: 'ADMIN',
			emailVerified: true,
			cart: {
				create: {},
			},
		},
	})

	// Create test customer
	const customerPassword = await bcrypt.hash('customer123', 12)
	await prisma.user.create({
		data: {
			email: 'customer@example.com',
			password: customerPassword,
			firstName: 'John',
			lastName: 'Doe',
			phone: '+420777888999',
			role: 'CUSTOMER',
			emailVerified: true,
			cart: {
				create: {},
			},
			addresses: {
				create: {
					street: 'Spálená 53',
					city: 'Praha',
					postalCode: '11000',
					country: 'CZ',
					isDefault: true,
				},
			},
		},
	})

	// Create sample products
	const products = [
		{
			sku: 'BOOK001',
			title: '1984',
			author: 'George Orwell',
			description: 'A dystopian social science fiction novel',
			price: 299,
			salePrice: 249,
			categoryId: fiction.id,
			type: 'BOOK' as const,
			condition: 'LIKE_NEW' as const,
			stock: 5,
			images: ['https://picsum.photos/seed/1984/400/600'],
			isbn: '978-0-452-28423-4',
			year: 1949,
			publisher: 'Secker & Warburg',
			language: 'en',
			pages: 328,
			weight: 400,
			featured: true,
		},
		{
			sku: 'BOOK002',
			title: 'Švejk',
			author: 'Jaroslav Hašek',
			description: 'Osudy dobrého vojáka Švejka za světové války',
			price: 199,
			categoryId: fiction.id,
			type: 'BOOK' as const,
			condition: 'GOOD' as const,
			stock: 10,
			images: ['https://picsum.photos/seed/svejk/400/600'],
			year: 1923,
			publisher: 'České nakladatelství',
			language: 'cs',
			pages: 752,
			weight: 800,
			featured: true,
		},
		{
			sku: 'VINYL001',
			title: 'The Dark Side of the Moon',
			author: 'Pink Floyd',
			description: 'Classic progressive rock album',
			price: 899,
			categoryId: vinyl.id,
			type: 'VINYL' as const,
			condition: 'LIKE_NEW' as const,
			stock: 2,
			images: ['https://picsum.photos/seed/darkside/400/400'],
			year: 1973,
			weight: 180,
			featured: true,
		},
		{
			sku: 'BOOK003',
			title: 'Sapiens: A Brief History of Humankind',
			author: 'Yuval Noah Harari',
			description: 'A narrative history of humanity',
			price: 399,
			categoryId: nonFiction.id,
			type: 'BOOK' as const,
			condition: 'NEW' as const,
			stock: 15,
			images: ['https://picsum.photos/seed/sapiens/400/600'],
			isbn: '978-0-06-231609-7',
			year: 2014,
			publisher: 'Harper',
			language: 'en',
			pages: 443,
			weight: 500,
		},
		{
			sku: 'BOOK004',
			title: 'Bible Kralická',
			author: 'Jednota bratrská',
			description: 'Historický překlad Bible do češtiny z roku 1613',
			price: 4999,
			categoryId: antiquarian.id,
			type: 'BOOK' as const,
			condition: 'ACCEPTABLE' as const,
			stock: 1,
			images: ['https://picsum.photos/seed/bible/400/600'],
			year: 1613,
			language: 'cs',
			pages: 1200,
			weight: 2000,
			featured: true,
		},
		{
			sku: 'VINYL002',
			title: 'Abbey Road',
			author: 'The Beatles',
			description: 'The eleventh studio album by the Beatles',
			price: 799,
			categoryId: vinyl.id,
			type: 'VINYL' as const,
			condition: 'GOOD' as const,
			stock: 3,
			images: ['https://picsum.photos/seed/abbey/400/400'],
			year: 1969,
			weight: 180,
		},
		{
			sku: 'CD001',
			title: 'OK Computer',
			author: 'Radiohead',
			description: 'Third studio album by Radiohead',
			price: 299,
			categoryId: vinyl.id,
			type: 'CD' as const,
			condition: 'LIKE_NEW' as const,
			stock: 8,
			images: ['https://picsum.photos/seed/okcomputer/400/400'],
			year: 1997,
			weight: 100,
		},
		{
			sku: 'POSTER001',
			title: 'Alfons Mucha - Job',
			author: 'Alfons Mucha',
			description: 'Art Nouveau advertising poster reproduction',
			price: 199,
			categoryId: nonFiction.id,
			type: 'POSTER' as const,
			condition: 'NEW' as const,
			stock: 20,
			images: ['https://picsum.photos/seed/mucha/400/600'],
			year: 1896,
			weight: 50,
		},
	]

	for (const product of products) {
		await prisma.product.create({ data: product })
	}

	console.log('Seed data created successfully!')
	console.log('Test accounts:')
	console.log('Admin: admin@spalena53.cz / admin123')
	console.log('Customer: customer@example.com / customer123')
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
