'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AccountPage() {
	const router = useRouter()
	const [user, setUser] = useState<any>(null)
	const [orders, setOrders] = useState<any[]>([])
	const [addresses, setAddresses] = useState<any[]>([])
	const [activeTab, setActiveTab] = useState('profile')
	const [loading, setLoading] = useState(true)
	const [editMode, setEditMode] = useState(false)

	// Edit form
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		phone: '',
		email: '',
	})

	// New address form
	const [newAddress, setNewAddress] = useState({
		street: '',
		city: '',
		postalCode: '',
		country: 'CZ',
	})

	useEffect(() => {
		loadUserData()
	}, [])

	const loadUserData = async () => {
		try {
			const res = await fetch('/api/auth/session', {
				credentials: 'include',
			})

			if (res.ok) {
				const data = await res.json()
				setUser(data.user)
				setFormData({
					firstName: data.user.firstName,
					lastName: data.user.lastName,
					phone: data.user.phone || '',
					email: data.user.email,
				})
				setAddresses(data.user.addresses || [])
				loadOrders()
			} else {
				router.push('/')
			}
		} catch (error) {
			console.error('Failed to load user data:', error)
			router.push('/')
		}
		setLoading(false)
	}

	const loadOrders = async () => {
		try {
			const res = await fetch('/api/orders', {
				credentials: 'include',
			})
			if (res.ok) {
				const data = await res.json()
				setOrders(data)
			}
		} catch (error) {
			console.error('Failed to load orders:', error)
		}
	}

	const handleUpdateProfile = async () => {
		// This would need an API endpoint to update user profile
		alert('Profile update functionality would be implemented here')
		setEditMode(false)
	}

	const handleAddAddress = async () => {
		// This would need an API endpoint to add address
		alert('Add address functionality would be implemented here')
		setNewAddress({ street: '', city: '', postalCode: '', country: 'CZ' })
	}

	const logout = async () => {
		await supabase.auth.signOut()
		router.push('/')
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b'>
				<div className='max-w-7xl mx-auto px-4 py-4'>
					<div className='flex justify-between items-center'>
						<h1 className='text-2xl font-bold'>My Account</h1>
						<div className='flex gap-4'>
							<button
								onClick={() => router.push('/')}
								className='text-blue-600 hover:text-blue-700'
							>
								← Back to Shop
							</button>
							<button
								onClick={logout}
								className='text-red-600 hover:text-red-700'
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</header>

			<div className='max-w-7xl mx-auto px-4 py-8'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
					{/* Sidebar */}
					<div className='lg:col-span-1'>
						<div className='bg-white rounded-lg shadow p-4'>
							<div className='space-y-2'>
								<button
									onClick={() => setActiveTab('profile')}
									className={`w-full text-left px-4 py-2 rounded ${
										activeTab === 'profile'
											? 'bg-blue-50 text-blue-600'
											: 'hover:bg-gray-50'
									}`}
								>
									Profile Information
								</button>
								<button
									onClick={() => setActiveTab('orders')}
									className={`w-full text-left px-4 py-2 rounded ${
										activeTab === 'orders'
											? 'bg-blue-50 text-blue-600'
											: 'hover:bg-gray-50'
									}`}
								>
									Order History ({orders.length})
								</button>
								<button
									onClick={() => setActiveTab('addresses')}
									className={`w-full text-left px-4 py-2 rounded ${
										activeTab === 'addresses'
											? 'bg-blue-50 text-blue-600'
											: 'hover:bg-gray-50'
									}`}
								>
									Addresses ({addresses.length})
								</button>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className='lg:col-span-3'>
						{/* Profile Tab */}
						{activeTab === 'profile' && (
							<div className='bg-white rounded-lg shadow p-6'>
								<div className='flex justify-between items-center mb-6'>
									<h2 className='text-xl font-semibold'>Profile Information</h2>
									<button
										onClick={() => setEditMode(!editMode)}
										className='text-blue-600 hover:text-blue-700'
									>
										{editMode ? 'Cancel' : 'Edit'}
									</button>
								</div>

								{editMode ? (
									<form className='space-y-4'>
										<div className='grid grid-cols-2 gap-4'>
											<div>
												<label className='block text-sm font-medium mb-2'>
													First Name
												</label>
												<input
													type='text'
													value={formData.firstName}
													onChange={e =>
														setFormData({
															...formData,
															firstName: e.target.value,
														})
													}
													className='w-full p-2 border rounded'
												/>
											</div>
											<div>
												<label className='block text-sm font-medium mb-2'>
													Last Name
												</label>
												<input
													type='text'
													value={formData.lastName}
													onChange={e =>
														setFormData({
															...formData,
															lastName: e.target.value,
														})
													}
													className='w-full p-2 border rounded'
												/>
											</div>
										</div>
										<div>
											<label className='block text-sm font-medium mb-2'>
												Email
											</label>
											<input
												type='email'
												value={formData.email}
												onChange={e =>
													setFormData({ ...formData, email: e.target.value })
												}
												className='w-full p-2 border rounded'
												disabled
											/>
										</div>
										<div>
											<label className='block text-sm font-medium mb-2'>
												Phone
											</label>
											<input
												type='tel'
												value={formData.phone}
												onChange={e =>
													setFormData({ ...formData, phone: e.target.value })
												}
												className='w-full p-2 border rounded'
											/>
										</div>
										<button
											type='button'
											onClick={handleUpdateProfile}
											className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
										>
											Save Changes
										</button>
									</form>
								) : (
									<div className='space-y-4'>
										<div>
											<span className='text-sm text-gray-500'>Name:</span>
											<p className='font-medium'>
												{user?.firstName} {user?.lastName}
											</p>
										</div>
										<div>
											<span className='text-sm text-gray-500'>Email:</span>
											<p className='font-medium'>{user?.email}</p>
										</div>
										<div>
											<span className='text-sm text-gray-500'>Phone:</span>
											<p className='font-medium'>
												{user?.phone || 'Not provided'}
											</p>
										</div>
										<div>
											<span className='text-sm text-gray-500'>
												Account Type:
											</span>
											<p className='font-medium'>{user?.role}</p>
										</div>
										<div>
											<span className='text-sm text-gray-500'>
												Member Since:
											</span>
											<p className='font-medium'>
												{user?.createdAt
													? new Date(user.createdAt).toLocaleDateString()
													: 'N/A'}
											</p>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Orders Tab */}
						{activeTab === 'orders' && (
							<div className='space-y-4'>
								<h2 className='text-xl font-semibold mb-4'>Order History</h2>
								{orders.length > 0 ? (
									orders.map(order => (
										<div
											key={order.id}
											className='bg-white rounded-lg shadow p-6'
										>
											<div className='flex justify-between items-start mb-4'>
												<div>
													<p className='font-semibold'>
														Order #{order.orderNumber}
													</p>
													<p className='text-sm text-gray-500'>
														{new Date(order.createdAt).toLocaleDateString()}
													</p>
												</div>
												<div className='text-right'>
													<p className='font-semibold'>{order.total} Kč</p>
													<span
														className={`text-sm px-2 py-1 rounded ${
															order.status === 'DELIVERED'
																? 'bg-green-100 text-green-600'
																: order.status === 'SHIPPED'
																? 'bg-blue-100 text-blue-600'
																: order.status === 'CONFIRMED'
																? 'bg-yellow-100 text-yellow-600'
																: 'bg-gray-100 text-gray-600'
														}`}
													>
														{order.status}
													</span>
												</div>
											</div>

											<div className='space-y-2 mb-4'>
												{order.items?.map((item: any) => (
													<div
														key={item.id}
														className='flex justify-between text-sm'
													>
														<span>
															{item.product.title} × {item.quantity}
														</span>
														<span>{item.price * item.quantity} Kč</span>
													</div>
												))}
											</div>

											<div className='flex justify-between items-center pt-4 border-t'>
												<div className='text-sm'>
													<span className='text-gray-500'>Delivery:</span>
													<span className='ml-2'>
														{order.deliveryMethod.replace('_', ' ')}
													</span>
												</div>
												{order.deliveryTrackingNumber && (
													<div className='text-sm'>
														<span className='text-gray-500'>Tracking:</span>
														<span className='ml-2 font-mono'>
															{order.deliveryTrackingNumber}
														</span>
													</div>
												)}
											</div>
										</div>
									))
								) : (
									<div className='bg-white rounded-lg shadow p-6 text-center'>
										<p className='text-gray-500'>No orders yet</p>
										<button
											onClick={() => router.push('/')}
											className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
										>
											Start Shopping
										</button>
									</div>
								)}
							</div>
						)}

						{/* Addresses Tab */}
						{activeTab === 'addresses' && (
							<div className='space-y-4'>
								<h2 className='text-xl font-semibold mb-4'>Saved Addresses</h2>

								{/* Existing Addresses */}
								{addresses.map(address => (
									<div
										key={address.id}
										className='bg-white rounded-lg shadow p-4'
									>
										<div className='flex justify-between items-start'>
											<div>
												<p className='font-medium'>{address.street}</p>
												<p className='text-sm text-gray-600'>
													{address.city}, {address.postalCode}
												</p>
												<p className='text-sm text-gray-600'>
													{address.country}
												</p>
												{address.isDefault && (
													<span className='text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded mt-2 inline-block'>
														Default
													</span>
												)}
											</div>
											<button className='text-red-600 hover:text-red-700 text-sm'>
												Remove
											</button>
										</div>
									</div>
								))}

								{/* Add New Address */}
								<div className='bg-white rounded-lg shadow p-4'>
									<h3 className='font-semibold mb-4'>Add New Address</h3>
									<form className='space-y-4'>
										<input
											type='text'
											placeholder='Street Address'
											value={newAddress.street}
											onChange={e =>
												setNewAddress({ ...newAddress, street: e.target.value })
											}
											className='w-full p-2 border rounded'
										/>
										<div className='grid grid-cols-2 gap-4'>
											<input
												type='text'
												placeholder='City'
												value={newAddress.city}
												onChange={e =>
													setNewAddress({ ...newAddress, city: e.target.value })
												}
												className='p-2 border rounded'
											/>
											<input
												type='text'
												placeholder='Postal Code'
												value={newAddress.postalCode}
												onChange={e =>
													setNewAddress({
														...newAddress,
														postalCode: e.target.value,
													})
												}
												className='p-2 border rounded'
											/>
										</div>
										<button
											type='button'
											onClick={handleAddAddress}
											className='bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600'
										>
											Add Address
										</button>
									</form>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
