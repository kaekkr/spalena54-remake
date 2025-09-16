'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Product, Cart, User } from '@/lib/types'

export default function Home() {
	const router = useRouter()
	const [products, setProducts] = useState<Product[]>([])
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
	const [cart, setCart] = useState<Cart | null>(null)
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState('')

	// Filters
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('')
	const [selectedType, setSelectedType] = useState('')
	const [priceRange, setPriceRange] = useState({ min: '', max: '' })
	const [sortBy, setSortBy] = useState('')

	useEffect(() => {
		loadProducts()
		checkAuth()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		filterProducts()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		products,
		searchQuery,
		selectedCategory,
		selectedType,
		priceRange,
		sortBy,
	])

	const loadProducts = async () => {
		try {
			const res = await fetch('/api/products')
			const data = await res.json()
			setProducts(data.products || [])
			setFilteredProducts(data.products || [])
		} catch {
			console.error('Failed to load products:', error)
		}
	}


	const checkAuth = async () => {
		try {
			const res = await fetch('/api/auth/session', {
				credentials: 'include',
			})
			if (res.ok) {
				const data = await res.json()
				setUser(data.user)
				loadCart()
			}
		} catch {
			console.log('Not logged in')
		}
	}

	const loadCart = async () => {
		try {
			const res = await fetch('/api/cart', {
				credentials: 'include',
			})
			if (res.ok) {
				const data = await res.json()
				setCart(data)
			}
		} catch {
			console.error('Failed to load cart:', error)
		}
	}

	const filterProducts = () => {
		let filtered = [...products]

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				p =>
					p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.description?.toLowerCase().includes(searchQuery.toLowerCase())
			)
		}

		// Category filter
		if (selectedCategory) {
			filtered = filtered.filter(p => p.category?.name === selectedCategory)
		}

		// Type filter
		if (selectedType) {
			filtered = filtered.filter(p => p.type === selectedType)
		}

		// Price filter
		if (priceRange.min) {
			filtered = filtered.filter(p => p.price >= parseFloat(priceRange.min))
		}
		if (priceRange.max) {
			filtered = filtered.filter(p => p.price <= parseFloat(priceRange.max))
		}

		// Sorting
		if (sortBy) {
			filtered.sort((a, b) => {
				switch (sortBy) {
					case 'price_asc':
						return a.price - b.price
					case 'price_desc':
						return b.price - a.price
					case 'title':
						return a.title.localeCompare(b.title)
					case 'newest':
						return (
							new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
						)
					default:
						return 0
				}
			})
		}

		setFilteredProducts(filtered)
	}


	const logout = async () => {
		await supabase.auth.signOut()
		setUser(null)
		setCart(null)
		setMessage('Logged out successfully')
		router.push('/')
	}

	const addToCart = async (productId: string) => {
		if (!user) {
			setMessage('Please login first!')
			return
		}

		setLoading(true)
		try {
			const res = await fetch('/api/cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId, quantity: 1 }),
				credentials: 'include',
			})

			if (res.ok) {
				const data = await res.json()
				setCart(data)
				setMessage('Added to cart!')
				setTimeout(() => setMessage(''), 3000)
			} else {
				setMessage('Failed to add to cart')
			}
		} catch {
			setMessage('Error adding to cart')
		}
		setLoading(false)
	}

	const cartItemCount =
		cart?.items?.reduce((sum: number, item) => sum + item.quantity, 0) || 0
	const cartTotal =
		cart?.items?.reduce(
			(sum: number, item) =>
				sum + (item.product.salePrice || item.product.price) * item.quantity,
			0
		) || 0

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b sticky top-0 z-50'>
				<div className='max-w-7xl mx-auto px-4 py-4'>
					<div className='flex justify-between items-center'>
						<h1 className='text-2xl font-bold text-gray-900'>
							📚 Spálená 53 - Antikvariát
						</h1>
						<div className='flex items-center gap-4'>
							{user ? (
								<>
									<button
										onClick={() => router.push('/account')}
										className='text-sm text-gray-600 hover:text-gray-900'
									>
										👤 {user.firstName} {user.lastName}
									</button>
									<button
										onClick={() => router.push('/cart')}
										className='relative'
									>
										<span className='text-2xl'>🛒</span>
										{cartItemCount > 0 && (
											<span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
												{cartItemCount}
											</span>
										)}
									</button>
									<button
										onClick={logout}
										className='text-sm text-red-600 hover:text-red-700'
									>
										Logout
									</button>
								</>
							) : (
								<div className='flex gap-2'>
									<button
										onClick={() => router.push('/auth/login')}
										className='bg-white text-gray-700 px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm'
									>
										Sign In
									</button>
									<button
										onClick={() => router.push('/auth/register')}
										className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm'
									>
										Sign Up
									</button>
								</div>
							)}
						</div>
					</div>

					{/* Search Bar */}
					<div className='mt-4'>
						<input
							type='text'
							placeholder='Search for books, authors, vinyl...'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
				</div>
			</header>

			{/* Message */}
			{message && (
				<div className='max-w-7xl mx-auto px-4 mt-4'>
					<div className='bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded'>
						{message}
					</div>
				</div>
			)}

			<div className='max-w-7xl mx-auto px-4 py-8'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
					{/* Filters Sidebar */}
					<div className='lg:col-span-1'>
						<div className='bg-white rounded-lg shadow p-4 sticky top-24'>
							<h2 className='font-semibold mb-4'>Filters</h2>

							{/* Category Filter */}
							<div className='mb-4'>
								<label className='block text-sm font-medium mb-2'>
									Category
								</label>
								<select
									value={selectedCategory}
									onChange={e => setSelectedCategory(e.target.value)}
									className='w-full p-2 border rounded'
								>
									<option value=''>All Categories</option>
									<option value='Fiction'>Fiction</option>
									<option value='Non-Fiction'>Non-Fiction</option>
									<option value='Czech Literature'>Czech Literature</option>
									<option value='Antiquarian'>Antiquarian</option>
									<option value='Vinyl Records'>Vinyl Records</option>
								</select>
							</div>

							{/* Type Filter */}
							<div className='mb-4'>
								<label className='block text-sm font-medium mb-2'>Type</label>
								<select
									value={selectedType}
									onChange={e => setSelectedType(e.target.value)}
									className='w-full p-2 border rounded'
								>
									<option value=''>All Types</option>
									<option value='BOOK'>Books</option>
									<option value='VINYL'>Vinyl Records</option>
									<option value='CD'>CDs</option>
									<option value='POSTER'>Posters</option>
									<option value='MAP'>Maps</option>
								</select>
							</div>

							{/* Price Range */}
							<div className='mb-4'>
								<label className='block text-sm font-medium mb-2'>
									Price Range (Kč)
								</label>
								<div className='flex gap-2'>
									<input
										type='number'
										placeholder='Min'
										value={priceRange.min}
										onChange={e =>
											setPriceRange({ ...priceRange, min: e.target.value })
										}
										className='w-1/2 p-2 border rounded'
									/>
									<input
										type='number'
										placeholder='Max'
										value={priceRange.max}
										onChange={e =>
											setPriceRange({ ...priceRange, max: e.target.value })
										}
										className='w-1/2 p-2 border rounded'
									/>
								</div>
							</div>

							{/* Sort By */}
							<div className='mb-4'>
								<label className='block text-sm font-medium mb-2'>
									Sort By
								</label>
								<select
									value={sortBy}
									onChange={e => setSortBy(e.target.value)}
									className='w-full p-2 border rounded'
								>
									<option value=''>Default</option>
									<option value='price_asc'>Price: Low to High</option>
									<option value='price_desc'>Price: High to Low</option>
									<option value='title'>Title: A-Z</option>
									<option value='newest'>Newest First</option>
								</select>
							</div>

							{/* Clear Filters */}
							<button
								onClick={() => {
									setSearchQuery('')
									setSelectedCategory('')
									setSelectedType('')
									setPriceRange({ min: '', max: '' })
									setSortBy('')
								}}
								className='w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 text-sm'
							>
								Clear All Filters
							</button>

							{/* Results Count */}
							<div className='mt-4 text-sm text-gray-600'>
								Showing {filteredProducts.length} of {products.length} products
							</div>
						</div>
					</div>

					{/* Products Grid */}
					<div className='lg:col-span-3'>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{filteredProducts.map(product => (
								<div
									key={product.id}
									className='bg-white rounded-lg shadow hover:shadow-lg transition-shadow'
								>
									<div
										className='cursor-pointer'
										onClick={() => router.push(`/product/${product.id}`)}
									>
										<img
											src={product.images[0]}
											alt={product.title}
											className='w-full h-48 object-cover rounded-t-lg'
										/>
										<div className='p-4'>
											<h3 className='font-semibold text-lg line-clamp-1'>
												{product.title}
											</h3>
											<p className='text-sm text-gray-600'>{product.author}</p>
											<div className='flex gap-2 mt-1'>
												<span className='text-xs bg-gray-100 px-2 py-1 rounded'>
													{product.type}
												</span>
												{product.condition && (
													<span className='text-xs bg-gray-100 px-2 py-1 rounded'>
														{product.condition}
													</span>
												)}
											</div>
											<p className='text-xs text-gray-500 mt-2'>
												Stock: {product.stock}
											</p>
											<div className='mt-3'>
												{product.salePrice ? (
													<>
														<span className='text-lg font-bold text-red-600'>
															{product.salePrice} Kč
														</span>
														<span className='text-sm text-gray-400 line-through ml-2'>
															{product.price} Kč
														</span>
													</>
												) : (
													<span className='text-lg font-bold'>
														{product.price} Kč
													</span>
												)}
											</div>
										</div>
									</div>
									<div className='px-4 pb-4'>
										<button
											onClick={e => {
												e.stopPropagation()
												addToCart(product.id)
											}}
											disabled={loading || product.stock === 0}
											className='w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm disabled:bg-gray-300'
										>
											{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
										</button>
									</div>
								</div>
							))}
						</div>

						{filteredProducts.length === 0 && (
							<div className='text-center py-12'>
								<p className='text-gray-500'>
									No products found matching your criteria.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Mini Cart (when logged in) */}
			{user && cart && cart.items?.length > 0 && (
				<div className='fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto'>
					<h3 className='font-semibold mb-2'>
						🛒 Cart ({cartItemCount} items)
					</h3>
					<div className='text-sm space-y-1 mb-3'>
						{cart.items.slice(0, 3).map((item) => (
							<div key={item.id} className='flex justify-between'>
								<span className='truncate'>{item.product.title}</span>
								<span>{item.quantity}x</span>
							</div>
						))}
						{cart.items.length > 3 && (
							<p className='text-gray-500'>
								...and {cart.items.length - 3} more
							</p>
						)}
					</div>
					<div className='border-t pt-2 mb-3'>
						<div className='flex justify-between font-semibold'>
							<span>Total:</span>
							<span>{cartTotal} Kč</span>
						</div>
					</div>
					<button
						onClick={() => router.push('/checkout')}
						className='w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm'
					>
						Checkout →
					</button>
				</div>
			)}
		</div>
	)
}
