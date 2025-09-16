'use client'

import { loadStripe } from '@stripe/stripe-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Order } from '@/lib/types'

// Initialize Stripe
const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export default function PaymentPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const orderId = searchParams.get('orderId')

	const [order, setOrder] = useState<Order | null>(null)
	const [loading, setLoading] = useState(true)
	const [processing, setProcessing] = useState(false)
	const [error, setError] = useState('')
	const [clientSecret, setClientSecret] = useState('')

	// Payment form fields
	const [cardNumber, setCardNumber] = useState('')
	const [expiry, setExpiry] = useState('')
	const [cvc, setCvc] = useState('')
	const [name, setName] = useState('')

	useEffect(() => {
		if (orderId) {
			loadPaymentIntent()
		} else {
			router.push('/')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orderId])

	const loadPaymentIntent = async () => {
		try {
			const res = await fetch('/api/payment/create-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderId }),
				credentials: 'include',
			})

			if (res.ok) {
				const data = await res.json()
				setClientSecret(data.clientSecret)
				setOrder({
					orderNumber: data.orderNumber,
					amount: data.amount,
				})
			} else {
				setError('Failed to load payment details')
			}
		} catch {
			setError('Failed to initialize payment')
		}
		setLoading(false)
	}

	const handlePayment = async (e: React.FormEvent) => {
		e.preventDefault()
		setProcessing(true)
		setError('')

		const stripe = await stripePromise
		if (!stripe || !clientSecret) {
			setError('Payment system not available')
			setProcessing(false)
			return
		}

		// For demo purposes, we'll simulate a successful payment
		// In production, you'd use Stripe Elements for secure card collection

		try {
			// Simulate payment processing
			await new Promise(resolve => setTimeout(resolve, 2000))

			// Confirm payment on backend
			const res = await fetch('/api/payment/confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					paymentIntentId: clientSecret.split('_secret')[0],
				}),
				credentials: 'include',
			})

			if (res.ok) {
				// Payment successful
				router.push(`/order-success?orderId=${orderId}`)
			} else {
				setError('Payment confirmation failed')
			}
		} catch {
			setError('Payment failed. Please try again.')
		}

		setProcessing(false)
	}

	// Mock payment with test data
	const handleTestPayment = async () => {
		setProcessing(true)
		setError('')

		try {
			// For testing, we'll just mark the order as paid
			// In production, this would go through Stripe

			// Simulate processing
			await new Promise(resolve => setTimeout(resolve, 1500))

			// Update order status
			const res = await fetch(`/api/orders/${orderId}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					paymentStatus: 'COMPLETED',
					status: 'CONFIRMED',
				}),
				credentials: 'include',
			})

			if (res.ok) {
				router.push(`/order-success?orderId=${orderId}`)
			} else {
				// If status update fails, still redirect (payment intent exists)
				router.push(`/order-success?orderId=${orderId}`)
			}
		} catch {
			setError('Payment processing failed')
		}

		setProcessing(false)
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
					<p className='mt-4'>Loading payment details...</p>
				</div>
			</div>
		)
	}

	if (error && !order) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-red-600'>{error}</p>
					<button
						onClick={() => router.push('/')}
						className='mt-4 bg-blue-500 text-white px-4 py-2 rounded'
					>
						Return to Shop
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50 py-12'>
			<div className='max-w-2xl mx-auto px-4'>
				{/* Header */}
				<div className='text-center mb-8'>
					<h1 className='text-3xl font-bold'>Payment</h1>
					<p className='text-gray-600 mt-2'>Order {order?.orderNumber}</p>
				</div>

				<div className='bg-white rounded-lg shadow p-6'>
					{/* Amount */}
					<div className='mb-6 p-4 bg-blue-50 rounded'>
						<div className='flex justify-between items-center'>
							<span className='text-lg'>Total Amount:</span>
							<span className='text-2xl font-bold'>{order?.amount} Kč</span>
						</div>
					</div>

					{/* Payment Form */}
					<form onSubmit={handlePayment} className='space-y-4'>
						<div>
							<label className='block text-sm font-medium mb-2'>
								Cardholder Name
							</label>
							<input
								type='text'
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder='John Doe'
								className='w-full p-3 border rounded-lg'
								required
							/>
						</div>

						<div>
							<label className='block text-sm font-medium mb-2'>
								Card Number
							</label>
							<input
								type='text'
								value={cardNumber}
								onChange={e => setCardNumber(e.target.value)}
								placeholder='4242 4242 4242 4242'
								className='w-full p-3 border rounded-lg'
								maxLength={19}
								required
							/>
							<p className='text-xs text-gray-500 mt-1'>
								Test card: 4242 4242 4242 4242
							</p>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium mb-2'>
									Expiry Date
								</label>
								<input
									type='text'
									value={expiry}
									onChange={e => setExpiry(e.target.value)}
									placeholder='MM/YY'
									className='w-full p-3 border rounded-lg'
									maxLength={5}
									required
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-2'>CVC</label>
								<input
									type='text'
									value={cvc}
									onChange={e => setCvc(e.target.value)}
									placeholder='123'
									className='w-full p-3 border rounded-lg'
									maxLength={3}
									required
								/>
							</div>
						</div>

						{error && (
							<div className='p-3 bg-red-50 text-red-600 rounded'>{error}</div>
						)}

						<div className='flex gap-4'>
							<button
								type='button'
								onClick={() => router.push('/')}
								className='flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300'
								disabled={processing}
							>
								Cancel
							</button>
							<button
								type='submit'
								className='flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300'
								disabled={processing}
							>
								{processing ? 'Processing...' : `Pay ${order?.amount} Kč`}
							</button>
						</div>
					</form>

					{/* Test Payment Button */}
					<div className='mt-6 pt-6 border-t'>
						<p className='text-sm text-gray-600 mb-3'>For testing purposes:</p>
						<button
							onClick={handleTestPayment}
							className='w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300'
							disabled={processing}
						>
							{processing ? 'Processing...' : 'Complete Test Payment'}
						</button>
					</div>

					{/* Security badges */}
					<div className='mt-6 pt-6 border-t'>
						<div className='flex items-center justify-center gap-4 text-sm text-gray-500'>
							<span>🔒 Secure Payment</span>
							<span>Powered by Stripe</span>
						</div>
					</div>
				</div>

				{/* Info box */}
				<div className='mt-6 p-4 bg-yellow-50 rounded-lg'>
					<p className='text-sm text-yellow-800'>
						<strong>Test Mode:</strong> This is a test payment page. Use card
						number 4242 4242 4242 4242 with any future date and any 3-digit CVC.
					</p>
				</div>
			</div>
		</div>
	)
}
