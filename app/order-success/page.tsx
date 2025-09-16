'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Order } from '@/lib/types'

export default function OrderSuccessPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const orderId = searchParams.get('orderId')
	const [order, setOrder] = useState<Order | null>(null)

	useEffect(() => {
		if (orderId) {
			loadOrder()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orderId])

	const loadOrder = async () => {
		try {
			const res = await fetch('/api/orders', {
				credentials: 'include',
			})
			if (res.ok) {
				const orders = await res.json()
				const currentOrder = orders.find((o: Order) => o.id === orderId)
				setOrder(currentOrder)
			}
		} catch (error) {
			console.error('Failed to load order:', error)
		}
	}

	return (
		<div className='min-h-screen bg-gray-50 py-12'>
			<div className='max-w-2xl mx-auto px-4 text-center'>
				<div className='bg-white rounded-lg shadow p-8'>
					{/* Success Icon */}
					<div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
						<span className='text-4xl'>✅</span>
					</div>

					<h1 className='text-3xl font-bold mb-4'>Order Successful!</h1>

					<p className='text-gray-600 mb-6'>
						Thank you for your order. We&apos;ve sent a confirmation email to your
						registered address.
					</p>

					{order && (
						<div className='bg-gray-50 rounded-lg p-6 mb-6 text-left'>
							<h2 className='font-semibold mb-3'>Order Details:</h2>
							<div className='space-y-2 text-sm'>
								<div className='flex justify-between'>
									<span>Order Number:</span>
									<span className='font-medium'>{order.orderNumber}</span>
								</div>
								<div className='flex justify-between'>
									<span>Total Amount:</span>
									<span className='font-medium'>{order.total} Kč</span>
								</div>
								<div className='flex justify-between'>
									<span>Delivery Method:</span>
									<span className='font-medium'>
										{order.deliveryMethod.replace('_', ' ')}
									</span>
								</div>
								<div className='flex justify-between'>
									<span>Payment Status:</span>
									<span className='font-medium text-green-600'>Paid</span>
								</div>
							</div>

							{order.deliveryTrackingNumber && (
								<div className='mt-4 pt-4 border-t'>
									<p className='text-sm'>
										<strong>Tracking Number:</strong>{' '}
										{order.deliveryTrackingNumber}
									</p>
								</div>
							)}
						</div>
					)}

					<div className='space-y-3'>
						<button
							onClick={() => router.push('/')}
							className='w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600'
						>
							Continue Shopping
						</button>

						<button
							onClick={() => window.print()}
							className='w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300'
						>
							Print Receipt
						</button>
					</div>

					<div className='mt-6 pt-6 border-t'>
						<p className='text-sm text-gray-500'>
							Need help? Contact us at support@spalena53.cz
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
