'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Product, User } from '@/lib/types'
import { fetchWithAuth } from '@/lib/auth/client'

export default function ProductDetailPage({
	params,
}: {
	params: { id: string }
}) {
	const router = useRouter()
	const [product, setProduct] = useState<Product | null>(null)
	const [user, setUser] = useState<User | null>(null)
	const [quantity, setQuantity] = useState(1)
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState('')
	const [activeImageIndex, setActiveImageIndex] = useState(0)

	useEffect(() => {
		loadProduct()
		checkAuth()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params.id])

	const loadProduct = async () => {
		try {
			const res = await fetch(`/api/products/${params.id}`)
			if (res.ok) {
				const data = await res.json()
				setProduct(data)
			} else {
				router.push('/')
			}
		} catch (error) {
			console.error('Failed to load product:', error)
			router.push('/')
		}
		setLoading(false)
	}

	const checkAuth = async () => {
		try {
			const res = await fetchWithAuth('/api/auth/session')
			if (res.ok) {
				const data = await res.json()
				setUser(data.user)
			}
		} catch {
			console.log('Not logged in')
		}
	}

	const addToCart = async () => {
		if (!user) {
			setMessage('Please login to add items to cart')
			return
		}

		setLoading(true)
		try {
			const res = await fetchWithAuth('/api/cart', {
				method: 'POST',
				body: JSON.stringify({ productId: product?.id, quantity }),
			})

			if (res.ok) {
				setMessage(`Added ${quantity} item(s) to cart!`)
				setTimeout(() => setMessage(''), 3000)
			} else {
				setMessage('Failed to add to cart')
			}
		} catch {
			setMessage('Error adding to cart')
		}
		setLoading(false)
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
			</div>
		)
	}

	if (!product) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<p>Product not found</p>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b'>
				<div className='max-w-7xl mx-auto px-4 py-4'>
					<div className='flex justify-between items-center'>
						<button
							onClick={() => router.push('/')}
							className='text-blue-600 hover:text-blue-700 flex items-center gap-2'
						>
							← Back to Shop
						</button>
						{user && (
							<div className='flex items-center gap-4'>
								<span className='text-sm text-gray-600'>👤 {user.email}</span>
								<button
									onClick={() => router.push('/cart')}
									className='text-blue-600 hover:text-blue-700'
								>
									🛒 View Cart
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Message */}
			{message && (
				<div className='max-w-7xl mx-auto px-4 mt-4'>
					<div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded'>
						{message}
					</div>
				</div>
			)}

			<div className='max-w-7xl mx-auto px-4 py-8'>
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Images */}
					<div>
						<div className='bg-white rounded-lg shadow p-4'>
							<img
								src={product.images[activeImageIndex] || product.images[0]}
								alt={product.title}
								className='w-full h-96 object-cover rounded'
							/>
							{product.images.length > 1 && (
								<div className='flex gap-2 mt-4'>
									{product.images.map((img: string, idx: number) => (
										<button
											key={idx}
											onClick={() => setActiveImageIndex(idx)}
											className={`w-20 h-20 border-2 rounded ${
												activeImageIndex === idx
													? 'border-blue-500'
													: 'border-gray-200'
											}`}
										>
											<img
												src={img}
												alt=''
												className='w-full h-full object-cover rounded'
											/>
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Product Info */}
					<div>
						<div className='bg-white rounded-lg shadow p-6'>
							{/* Title and Author */}
							<h1 className='text-3xl font-bold mb-2'>{product.title}</h1>
							{product.author && (
								<p className='text-xl text-gray-600 mb-4'>
									by {product.author}
								</p>
							)}

							{/* Price */}
							<div className='mb-6'>
								{product.salePrice ? (
									<div>
										<span className='text-3xl font-bold text-red-600'>
											{product.salePrice} Kč
										</span>
										<span className='text-xl text-gray-400 line-through ml-3'>
											{product.price} Kč
										</span>
										<span className='ml-3 bg-red-100 text-red-600 px-2 py-1 rounded text-sm'>
											Save{' '}
											{Math.round(
												((product.price - product.salePrice) / product.price) *
													100
											)}
											%
										</span>
									</div>
								) : (
									<span className='text-3xl font-bold'>{product.price} Kč</span>
								)}
							</div>

							{/* Details */}
							<div className='grid grid-cols-2 gap-4 mb-6 text-sm'>
								<div>
									<span className='text-gray-500'>Type:</span>
									<span className='ml-2 font-medium'>{product.type}</span>
								</div>
								{product.condition && (
									<div>
										<span className='text-gray-500'>Condition:</span>
										<span className='ml-2 font-medium'>
											{product.condition}
										</span>
									</div>
								)}
								{product.isbn && (
									<div>
										<span className='text-gray-500'>ISBN:</span>
										<span className='ml-2 font-medium'>{product.isbn}</span>
									</div>
								)}
								{product.year && (
									<div>
										<span className='text-gray-500'>Year:</span>
										<span className='ml-2 font-medium'>{product.year}</span>
									</div>
								)}
								{product.publisher && (
									<div>
										<span className='text-gray-500'>Publisher:</span>
										<span className='ml-2 font-medium'>
											{product.publisher}
										</span>
									</div>
								)}
								{product.pages && (
									<div>
										<span className='text-gray-500'>Pages:</span>
										<span className='ml-2 font-medium'>{product.pages}</span>
									</div>
								)}
								<div>
									<span className='text-gray-500'>Language:</span>
									<span className='ml-2 font-medium'>
										{product.language === 'cs' ? 'Czech' : 'English'}
									</span>
								</div>
								<div>
									<span className='text-gray-500'>Category:</span>
									<span className='ml-2 font-medium'>
										{product.category?.name}
									</span>
								</div>
							</div>

							{/* Stock Status */}
							<div className='mb-6'>
								{product.stock > 0 ? (
									<div className='flex items-center gap-2'>
										<span className='text-green-600'>✓ In Stock</span>
										<span className='text-gray-500'>
											({product.stock} available)
										</span>
									</div>
								) : (
									<span className='text-red-600'>Out of Stock</span>
								)}
							</div>

							{/* Add to Cart */}
							{product.stock > 0 && (
								<div className='flex gap-4 mb-6'>
									<div className='flex items-center gap-2'>
										<button
											onClick={() => setQuantity(Math.max(1, quantity - 1))}
											className='w-10 h-10 border rounded hover:bg-gray-100'
											disabled={quantity <= 1}
										>
											-
										</button>
										<input
											type='number'
											value={quantity}
											onChange={e =>
												setQuantity(
													Math.min(
														product.stock,
														Math.max(1, parseInt(e.target.value) || 1)
													)
												)
											}
											className='w-16 text-center border rounded'
											min='1'
											max={product.stock}
										/>
										<button
											onClick={() =>
												setQuantity(Math.min(product.stock, quantity + 1))
											}
											className='w-10 h-10 border rounded hover:bg-gray-100'
											disabled={quantity >= product.stock}
										>
											+
										</button>
									</div>
									<button
										onClick={addToCart}
										disabled={loading}
										className='flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-300'
									>
										Add to Cart
									</button>
								</div>
							)}

							{/* Description */}
							{product.description && (
								<div className='border-t pt-6'>
									<h3 className='font-semibold mb-2'>Description</h3>
									<p className='text-gray-600'>{product.description}</p>
								</div>
							)}

							{/* Reviews */}
							{product.reviews && product.reviews.length > 0 && (
								<div className='border-t pt-6 mt-6'>
									<h3 className='font-semibold mb-4'>
										Reviews ({product.reviewCount})
										{(product.avgRating || 0) > 0 && (
											<span className='ml-2 text-yellow-500'>
												{'★'.repeat(Math.round(product.avgRating || 0))}
												<span className='text-gray-400'>
													{'★'.repeat(5 - Math.round(product.avgRating || 0))}
												</span>
												<span className='ml-1 text-sm text-gray-600'>
													({(product.avgRating || 0).toFixed(1)})
												</span>
											</span>
										)}
									</h3>
									<div className='space-y-4'>
										{product.reviews.map((review) => (
											<div key={review.id} className='border-b pb-4'>
												<div className='flex items-center gap-2 mb-2'>
													<span className='font-medium'>
														{review.user?.firstName} {review.user?.lastName}
													</span>
													<span className='text-yellow-500'>
														{'★'.repeat(review.rating)}
														<span className='text-gray-400'>
															{'★'.repeat(5 - review.rating)}
														</span>
													</span>
												</div>
												{review.comment && (
													<p className='text-gray-600'>{review.comment}</p>
												)}
												<p className='text-xs text-gray-400 mt-1'>
													{new Date(review.createdAt).toLocaleDateString()}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
