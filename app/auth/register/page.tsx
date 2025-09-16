'use client'

import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
	const router = useRouter()
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
		phone: '',
		acceptTerms: false,
	})
	const [errors, setErrors] = useState<any>({})
	const [loading, setLoading] = useState(false)

	const validateForm = () => {
		const newErrors: any = {}

		if (!formData.firstName.trim()) {
			newErrors.firstName = 'First name is required'
		}

		if (!formData.lastName.trim()) {
			newErrors.lastName = 'Last name is required'
		}

		if (!formData.email.trim()) {
			newErrors.email = 'Email is required'
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid'
		}

		if (!formData.password) {
			newErrors.password = 'Password is required'
		} else if (formData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters'
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match'
		}

		if (!formData.acceptTerms) {
			newErrors.acceptTerms = 'You must accept the terms and conditions'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleEmailSignUp = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		setLoading(true)

		try {
			// Step 1: Sign up with Supabase Auth
			const { data: authData, error: authError } = await supabase.auth.signUp({
				email: formData.email,
				password: formData.password,
				options: {
					data: {
						first_name: formData.firstName,
						last_name: formData.lastName,
						phone: formData.phone,
					},
				},
			})

			if (authError) {
				setErrors({ submit: authError.message })
				setLoading(false)
				return
			}

			if (authData.user) {
				// Step 2: Create user in your database
				const { error: dbError } = await supabase.from('User').insert({
					id: authData.user.id,
					email: formData.email,
					firstName: formData.firstName,
					lastName: formData.lastName,
					phone: formData.phone || null,
					password: 'supabase_auth', // Placeholder since auth is handled by Supabase
					role: 'CUSTOMER',
					emailVerified: false,
				})

				if (!dbError) {
					// Create cart for new user
					await supabase.from('Cart').insert({
						userId: authData.user.id,
					})
				}

				// Check if email confirmation is required
				if (authData.user.identities?.length === 0) {
					setErrors({
						submit:
							'Please check your email to confirm your account before signing in.',
					})
				} else {
					// Auto sign in after registration
					router.push('/')
				}
			}
		} catch (error) {
			setErrors({
				submit: 'An error occurred during registration. Please try again.',
			})
		}

		setLoading(false)
	}

	const handleSocialSignUp = async (provider: 'google' | 'facebook') => {
		setLoading(true)
		try {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			})

			if (error) {
				setErrors({ submit: error.message })
				setLoading(false)
			}
			// User will be redirected to provider
		} catch (error) {
			setErrors({ submit: 'An error occurred. Please try again.' })
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<div className='sm:mx-auto sm:w-full sm:max-w-md'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold text-gray-900 mb-2'>📚</h1>
					<h2 className='text-3xl font-bold text-gray-900'>Create Account</h2>
					<p className='mt-2 text-gray-600'>Join Spálená 53 Bookstore</p>
				</div>
			</div>

			<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
				<div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{/* Social Sign Up Buttons */}
					<div className='space-y-3'>
						<button
							onClick={() => handleSocialSignUp('google')}
							disabled={loading}
							className='w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
						>
							<svg className='w-5 h-5' viewBox='0 0 24 24'>
								<path
									fill='#4285F4'
									d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
								/>
								<path
									fill='#34A853'
									d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
								/>
								<path
									fill='#FBBC05'
									d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
								/>
								<path
									fill='#EA4335'
									d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
								/>
							</svg>
							Sign up with Google
						</button>

						<button
							onClick={() => handleSocialSignUp('facebook')}
							disabled={loading}
							className='w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
						>
							<svg className='w-5 h-5' fill='#1877F2' viewBox='0 0 24 24'>
								<path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
							</svg>
							Sign up with Facebook
						</button>
					</div>

					<div className='mt-6'>
						<div className='relative'>
							<div className='absolute inset-0 flex items-center'>
								<div className='w-full border-t border-gray-300' />
							</div>
							<div className='relative flex justify-center text-sm'>
								<span className='px-2 bg-white text-gray-500'>
									Or sign up with email
								</span>
							</div>
						</div>
					</div>

					<form className='mt-6 space-y-6' onSubmit={handleEmailSignUp}>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label
									htmlFor='firstName'
									className='block text-sm font-medium text-gray-700'
								>
									First name
								</label>
								<div className='mt-1'>
									<input
										id='firstName'
										name='firstName'
										type='text'
										autoComplete='given-name'
										required
										value={formData.firstName}
										onChange={e =>
											setFormData({ ...formData, firstName: e.target.value })
										}
										className={`appearance-none block w-full px-3 py-2 border ${
											errors.firstName ? 'border-red-300' : 'border-gray-300'
										} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
									/>
									{errors.firstName && (
										<p className='mt-1 text-xs text-red-600'>
											{errors.firstName}
										</p>
									)}
								</div>
							</div>

							<div>
								<label
									htmlFor='lastName'
									className='block text-sm font-medium text-gray-700'
								>
									Last name
								</label>
								<div className='mt-1'>
									<input
										id='lastName'
										name='lastName'
										type='text'
										autoComplete='family-name'
										required
										value={formData.lastName}
										onChange={e =>
											setFormData({ ...formData, lastName: e.target.value })
										}
										className={`appearance-none block w-full px-3 py-2 border ${
											errors.lastName ? 'border-red-300' : 'border-gray-300'
										} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
									/>
									{errors.lastName && (
										<p className='mt-1 text-xs text-red-600'>
											{errors.lastName}
										</p>
									)}
								</div>
							</div>
						</div>

						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-700'
							>
								Email address
							</label>
							<div className='mt-1'>
								<input
									id='email'
									name='email'
									type='email'
									autoComplete='email'
									required
									value={formData.email}
									onChange={e =>
										setFormData({ ...formData, email: e.target.value })
									}
									className={`appearance-none block w-full px-3 py-2 border ${
										errors.email ? 'border-red-300' : 'border-gray-300'
									} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
									placeholder='you@example.com'
								/>
								{errors.email && (
									<p className='mt-1 text-xs text-red-600'>{errors.email}</p>
								)}
							</div>
						</div>

						<div>
							<label
								htmlFor='phone'
								className='block text-sm font-medium text-gray-700'
							>
								Phone number (optional)
							</label>
							<div className='mt-1'>
								<input
									id='phone'
									name='phone'
									type='tel'
									autoComplete='tel'
									value={formData.phone}
									onChange={e =>
										setFormData({ ...formData, phone: e.target.value })
									}
									className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
									placeholder='+420 777 888 999'
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'
							>
								Password
							</label>
							<div className='mt-1'>
								<input
									id='password'
									name='password'
									type='password'
									autoComplete='new-password'
									required
									value={formData.password}
									onChange={e =>
										setFormData({ ...formData, password: e.target.value })
									}
									className={`appearance-none block w-full px-3 py-2 border ${
										errors.password ? 'border-red-300' : 'border-gray-300'
									} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
									placeholder='••••••••'
								/>
								{errors.password && (
									<p className='mt-1 text-xs text-red-600'>{errors.password}</p>
								)}
							</div>
						</div>

						<div>
							<label
								htmlFor='confirmPassword'
								className='block text-sm font-medium text-gray-700'
							>
								Confirm password
							</label>
							<div className='mt-1'>
								<input
									id='confirmPassword'
									name='confirmPassword'
									type='password'
									autoComplete='new-password'
									required
									value={formData.confirmPassword}
									onChange={e =>
										setFormData({
											...formData,
											confirmPassword: e.target.value,
										})
									}
									className={`appearance-none block w-full px-3 py-2 border ${
										errors.confirmPassword
											? 'border-red-300'
											: 'border-gray-300'
									} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
									placeholder='••••••••'
								/>
								{errors.confirmPassword && (
									<p className='mt-1 text-xs text-red-600'>
										{errors.confirmPassword}
									</p>
								)}
							</div>
						</div>

						<div className='flex items-start'>
							<div className='flex items-center h-5'>
								<input
									id='acceptTerms'
									name='acceptTerms'
									type='checkbox'
									checked={formData.acceptTerms}
									onChange={e =>
										setFormData({ ...formData, acceptTerms: e.target.checked })
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
							</div>
							<div className='ml-3 text-sm'>
								<label
									htmlFor='acceptTerms'
									className='font-medium text-gray-700'
								>
									I agree to the{' '}
									<a href='#' className='text-blue-600 hover:text-blue-500'>
										Terms and Conditions
									</a>{' '}
									and{' '}
									<a href='#' className='text-blue-600 hover:text-blue-500'>
										Privacy Policy
									</a>
								</label>
								{errors.acceptTerms && (
									<p className='mt-1 text-xs text-red-600'>
										{errors.acceptTerms}
									</p>
								)}
							</div>
						</div>

						{errors.submit && (
							<div className='rounded-md bg-red-50 p-4'>
								<p className='text-sm text-red-800'>{errors.submit}</p>
							</div>
						)}

						<div>
							<button
								type='submit'
								disabled={loading}
								className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300'
							>
								{loading ? 'Creating account...' : 'Create account'}
							</button>
						</div>
					</form>

					<div className='mt-6'>
						<div className='text-center'>
							<span className='text-sm text-gray-600'>
								Already have an account?{' '}
								<Link
									href='/auth/login'
									className='font-medium text-blue-600 hover:text-blue-500'
								>
									Sign in
								</Link>
							</span>
						</div>
					</div>

					<div className='mt-6 text-center'>
						<Link
							href='/'
							className='text-sm text-gray-600 hover:text-gray-900'
						>
							← Back to shop
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
