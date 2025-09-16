// User Types
export interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string | null
  role: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE'
  emailVerified: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

// Address Types
export interface Address {
  id: string
  userId: string
  street: string
  city: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: Date | string
}

// Product Types
export type ProductType = 'BOOK' | 'VINYL' | 'CD' | 'POSTER' | 'MAP' | 'OTHER'
export type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'ACCEPTABLE' | 'COLLECTIBLE'

export interface Product {
  id: string
  sku: string
  title: string
  author?: string | null
  description?: string | null
  price: number
  salePrice?: number | null
  categoryId: string
  category?: Category
  type: ProductType
  condition?: Condition | null
  stock: number
  images: string[]
  isbn?: string | null
  year?: number | null
  publisher?: string | null
  language: string
  pages?: number | null
  weight?: number | null
  featured: boolean
  active: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  parentId?: string | null
  parent?: Category | null
  children?: Category[]
  products?: Product[]
  createdAt: Date | string
}

// Cart Types
export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  updatedAt: Date | string
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  product: Product
}

// Order Types
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY' | 'PAYPAL'
export type DeliveryMethod = 'PERSONAL_PICKUP' | 'CZECH_POST' | 'PPL' | 'DPD' | 'ZASILKOVNA'

export interface Order {
  id: string
  orderNumber: string
  userId: string
  addressId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  deliveryMethod: DeliveryMethod
  deliveryPrice: number
  deliveryTrackingNumber?: string | null
  subtotal: number
  total: number
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  user?: User
  address?: Address
  items?: OrderItem[]
  payment?: Payment | null
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product: Product
}

// Payment Types
export interface Payment {
  id: string
  orderId: string
  transactionId?: string | null
  amount: number
  currency: string
  status: PaymentStatus
  method: PaymentMethod
  metadata?: Record<string, unknown>
  createdAt: Date | string
  order?: Order
}

// Review Types
export interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  comment?: string | null
  createdAt: Date | string
  user?: User
  product?: Product
}

// Delivery Price Types
export interface DeliveryPrice {
  method: DeliveryMethod
  name: string
  basePrice: number
  weightPrice: number
  estimatedDays: string
}

// Form Data Types
export interface CheckoutFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  city: string
  postalCode: string
  deliveryMethod: DeliveryMethod
  paymentMethod: PaymentMethod
  notes: string
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Session Types
export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  role: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE'
}

export interface Session {
  user: SessionUser
}