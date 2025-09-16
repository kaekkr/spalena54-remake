import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
	console.log('🌱 Starting seed...')

	try {
		// Clear existing data in correct order (respecting foreign key constraints)
		console.log('🧹 Clearing existing data...')
		await prisma.cartItem.deleteMany()
		await prisma.cart.deleteMany()
		await prisma.orderItem.deleteMany()
		await prisma.payment.deleteMany()
		await prisma.order.deleteMany()
		await prisma.review.deleteMany()
		await prisma.address.deleteMany()
		await prisma.product.deleteMany()
		await prisma.category.deleteMany()
		await prisma.user.deleteMany()
		console.log('✅ Cleared existing data')

		// Create categories
		console.log('📚 Creating categories...')
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

		const czech = await prisma.category.create({
			data: {
				name: 'Czech Literature',
				slug: 'czech-literature',
				description: 'Czech authors and literature',
			},
		})
		console.log('✅ Created categories')

		// Create test users
		console.log('👥 Creating users...')

		// Admin user
		const adminPassword = await bcrypt.hash('admin123', 12)
		const admin = await prisma.user.create({
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

		// Customer user
		const customerPassword = await bcrypt.hash('customer123', 12)
		const customer = await prisma.user.create({
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
		console.log('✅ Created users')

		// Create sample products
		console.log('📦 Creating products...')
		const products = [
			// Fiction Books
			{
				sku: 'BOOK001',
				title: '1984',
				author: 'George Orwell',
				description:
					'A dystopian social science fiction novel and cautionary tale about the dangers of totalitarianism',
				price: 299,
				salePrice: 249,
				categoryId: fiction.id,
				type: 'BOOK',
				condition: 'LIKE_NEW',
				stock: 5,
				images: ['https://picsum.photos/seed/1984/400/600'],
				isbn: '978-0-452-28423-4',
				year: 1949,
				publisher: 'Secker & Warburg',
				language: 'en',
				pages: 328,
				weight: 400,
				featured: true,
				active: true,
			},
			{
				sku: 'BOOK002',
				title: 'Osudy dobrého vojáka Švejka',
				author: 'Jaroslav Hašek',
				description:
					'Satirický román o dobrém vojáku Švejkovi a jeho příhodách za první světové války',
				price: 199,
				categoryId: czech.id,
				type: 'BOOK',
				condition: 'GOOD',
				stock: 10,
				images: ['https://picsum.photos/seed/svejk/400/600'],
				year: 1923,
				publisher: 'České nakladatelství',
				language: 'cs',
				pages: 752,
				weight: 800,
				featured: true,
				active: true,
			},
			{
				sku: 'BOOK003',
				title: 'Bylo nás pět',
				author: 'Karel Poláček',
				description: 'Humoristický román o klucích z malého města',
				price: 149,
				categoryId: czech.id,
				type: 'BOOK',
				condition: 'GOOD',
				stock: 7,
				images: ['https://picsum.photos/seed/pet/400/600'],
				year: 1946,
				publisher: 'František Borový',
				language: 'cs',
				pages: 280,
				weight: 350,
				active: true,
			},

			// Non-Fiction
			{
				sku: 'BOOK004',
				title: 'Sapiens: A Brief History of Humankind',
				author: 'Yuval Noah Harari',
				description:
					'A narrative history of humanity from the Stone Age to the modern age',
				price: 399,
				categoryId: nonFiction.id,
				type: 'BOOK',
				condition: 'NEW',
				stock: 15,
				images: ['https://picsum.photos/seed/sapiens/400/600'],
				isbn: '978-0-06-231609-7',
				year: 2014,
				publisher: 'Harper',
				language: 'en',
				pages: 443,
				weight: 500,
				active: true,
			},

			// Antiquarian
			{
				sku: 'BOOK005',
				title: 'Bible Kralická - První vydání',
				author: 'Jednota bratrská',
				description:
					'Vzácné první vydání Bible kralické z roku 1613, historický překlad Bible do češtiny',
				price: 24999,
				categoryId: antiquarian.id,
				type: 'BOOK',
				condition: 'ACCEPTABLE',
				stock: 1,
				images: ['https://picsum.photos/seed/bible/400/600'],
				year: 1613,
				language: 'cs',
				pages: 1200,
				weight: 2000,
				featured: true,
				active: true,
			},
			{
				sku: 'BOOK006',
				title: 'Komenského Labyrint světa a ráj srdce',
				author: 'Jan Amos Komenský',
				description: 'Vzácné vydání alegorického spisu z 18. století',
				price: 8999,
				categoryId: antiquarian.id,
				type: 'BOOK',
				condition: 'ACCEPTABLE',
				stock: 1,
				images: ['https://picsum.photos/seed/labyrint/400/600'],
				year: 1782,
				publisher: 'Tisk Johanna Ferdinanda',
				language: 'cs',
				pages: 456,
				weight: 800,
				active: true,
			},

			// Vinyl Records
			{
				sku: 'VINYL001',
				title: 'The Dark Side of the Moon',
				author: 'Pink Floyd',
				description:
					'Original pressing of the legendary progressive rock album',
				price: 899,
				categoryId: vinyl.id,
				type: 'VINYL',
				condition: 'LIKE_NEW',
				stock: 2,
				images: ['https://picsum.photos/seed/darkside/400/400'],
				year: 1973,
				weight: 180,
				featured: true,
				active: true,
			},
			{
				sku: 'VINYL002',
				title: 'Abbey Road',
				author: 'The Beatles',
				description:
					'The eleventh studio album by the English rock band the Beatles',
				price: 799,
				categoryId: vinyl.id,
				type: 'VINYL',
				condition: 'GOOD',
				stock: 3,
				images: ['https://picsum.photos/seed/abbey/400/400'],
				year: 1969,
				weight: 180,
				active: true,
			},
			{
				sku: 'VINYL003',
				title: 'Nevermind',
				author: 'Nirvana',
				description: 'The album that brought alternative rock to mainstream',
				price: 699,
				categoryId: vinyl.id,
				type: 'VINYL',
				condition: 'NEW',
				stock: 5,
				images: ['https://picsum.photos/seed/nevermind/400/400'],
				year: 1991,
				weight: 180,
				active: true,
			},

			// CDs
			{
				sku: 'CD001',
				title: 'OK Computer',
				author: 'Radiohead',
				description: 'Third studio album by the English rock band Radiohead',
				price: 299,
				categoryId: vinyl.id,
				type: 'CD',
				condition: 'LIKE_NEW',
				stock: 8,
				images: ['https://picsum.photos/seed/okcomputer/400/400'],
				year: 1997,
				weight: 100,
				active: true,
			},
			{
				sku: 'CD002',
				title: 'Noc a den',
				author: 'Lucie',
				description: 'Populární album české rockové skupiny Lucie',
				price: 199,
				categoryId: vinyl.id,
				type: 'CD',
				condition: 'LIKE_NEW',
				stock: 6,
				images: ['https://picsum.photos/seed/lucie/400/400'],
				year: 1991,
				weight: 100,
				active: true,
			},

			// Posters
			{
				sku: 'POSTER001',
				title: 'Alfons Mucha - Job',
				author: 'Alfons Mucha',
				description:
					'High-quality reproduction of the famous Art Nouveau advertising poster',
				price: 199,
				categoryId: nonFiction.id,
				type: 'POSTER',
				condition: 'NEW',
				stock: 20,
				images: ['https://picsum.photos/seed/mucha/400/600'],
				year: 1896,
				weight: 50,
				active: true,
			},
			{
				sku: 'POSTER002',
				title: 'Národní divadlo - Historický plakát',
				author: 'Neznámý',
				description: 'Reprodukce historického plakátu Národního divadla',
				price: 149,
				categoryId: nonFiction.id,
				type: 'POSTER',
				condition: 'NEW',
				stock: 15,
				images: ['https://picsum.photos/seed/divadlo/400/600'],
				year: 1920,
				weight: 50,
				active: true,
			},

			// Maps
			{
				sku: 'MAP001',
				title: 'Mapa Prahy z roku 1885',
				author: 'František Krejčí',
				description:
					'Historická mapa Prahy s detailním vyobrazením centra města',
				price: 599,
				categoryId: antiquarian.id,
				type: 'MAP',
				condition: 'GOOD',
				stock: 3,
				images: ['https://picsum.photos/seed/praha-map/600/400'],
				year: 1885,
				weight: 100,
				active: true,
			},
		]

		let createdCount = 0
		for (const product of products) {
			await prisma.product.create({ data: product })
			createdCount++
			console.log(`  📖 Created: ${product.title}`)
		}
		console.log(`✅ Created ${createdCount} products`)

		// Add some reviews for featured products
		console.log('⭐ Creating sample reviews...')
		await prisma.review.create({
			data: {
				userId: customer.id,
				productId: (
					await prisma.product.findFirst({ where: { sku: 'BOOK001' } })
				)?.id!,
				rating: 5,
				comment: 'Klasické dílo, které by měl číst každý. Výborný stav knihy.',
			},
		})

		await prisma.review.create({
			data: {
				userId: customer.id,
				productId: (
					await prisma.product.findFirst({ where: { sku: 'VINYL001' } })
				)?.id!,
				rating: 5,
				comment: 'Perfektní stav, krásný zvuk. Doporučuji!',
			},
		})
		console.log('✅ Created sample reviews')

		// Final statistics
		const stats = {
			users: await prisma.user.count(),
			products: await prisma.product.count(),
			categories: await prisma.category.count(),
			reviews: await prisma.review.count(),
		}

		console.log('\n📊 Database seeded successfully!')
		console.log('=====================================')
		console.log(`Users: ${stats.users}`)
		console.log(`Products: ${stats.products}`)
		console.log(`Categories: ${stats.categories}`)
		console.log(`Reviews: ${stats.reviews}`)
		console.log('\n📧 Test accounts:')
		console.log('=====================================')
		console.log('Admin: admin@spalena53.cz / admin123')
		console.log('Customer: customer@example.com / customer123')
		console.log('=====================================\n')
	} catch (error) {
		console.error('❌ Error seeding database:', error)
		throw error
	}
}

main()
	.catch(e => {
		console.error('Fatal error:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
