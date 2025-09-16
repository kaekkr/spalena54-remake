'use client';

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<any>(null);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('CARD');
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<string>('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // New address form (only for Czech Post delivery)
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  useEffect(() => {
    loadUserData();
    loadCart();
    loadDeliveryMethods();
  }, []);

  const loadUserData = async () => {
    try {
      // Get current user session
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Load user's saved addresses if any
        if (data.user.addresses) {
          setUserAddresses(data.user.addresses);
          const defaultAddr = data.user.addresses.find((a: any) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        }
      } else {
        // Not logged in, redirect to login
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      router.push('/');
    }
  };

  const loadCart = async () => {
    try {
      const res = await fetch('/api/cart', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
          alert('Your cart is empty');
          router.push('/');
        }
        setCart(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      router.push('/');
    }
  };

  const loadDeliveryMethods = async () => {
    try {
      const res = await fetch('/api/delivery/methods');
      const data = await res.json();
      setDeliveryMethods(data);
    } catch (error) {
      console.error('Failed to load delivery methods:', error);
    }
  };

  const loadPickupPoints = async (provider: string) => {
    try {
      const res = await fetch(`/api/delivery/points?provider=${provider}&city=Praha`);
      const data = await res.json();
      setPickupPoints(data);
    } catch (error) {
      console.error('Failed to load pickup points:', error);
    }
  };

  const handleDeliverySelect = (methodId: string) => {
    setSelectedDelivery(methodId);
    setSelectedPickupPoint('');
    
    if (methodId === 'ZASILKOVNA' || methodId === 'PPL') {
      loadPickupPoints(methodId);
    }
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    const subtotal = cart.items.reduce((sum: number, item: any) => 
      sum + (item.product.salePrice || item.product.price) * item.quantity, 0
    );
    const delivery = deliveryMethods.find(m => m.id === selectedDelivery);
    return subtotal + (delivery?.price || 0);
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    try {
      const orderData: any = {
        deliveryMethod: selectedDelivery,
        paymentMethod: selectedPayment,
        notes: '',
      };

      // Add pickup point if selected
      if (selectedPickupPoint) {
        orderData.deliveryPointId = selectedPickupPoint;
      }

      // Handle address based on delivery method
      if (selectedDelivery === 'PERSONAL_PICKUP') {
        // For personal pickup, use user's email from session
        orderData.useExistingAddress = false;
        orderData.address = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '+420000000000',
          street: 'Personal Pickup',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ',
        };
      } else if (selectedDelivery === 'ZASILKOVNA' || selectedDelivery === 'PPL' || selectedDelivery === 'DPD') {
        // For pickup points, use user info with pickup location
        orderData.useExistingAddress = false;
        orderData.address = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: newAddress.phone || user.phone || '+420000000000',
          street: 'Pickup Point',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ',
        };
      } else if (selectedDelivery === 'CZECH_POST') {
        // For home delivery, use complete address
        if (selectedAddressId && selectedAddressId !== 'new') {
          // Use existing address
          orderData.useExistingAddress = true;
          orderData.addressId = selectedAddressId;
        } else {
          // Use new address
          orderData.useExistingAddress = false;
          orderData.address = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: newAddress.phone,
            street: newAddress.street,
            city: newAddress.city,
            postalCode: newAddress.postalCode,
            country: 'CZ',
          };
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to payment page for card payments, or success for other methods
        if (orderData.paymentMethod === 'CARD') {
          router.push(`/payment?orderId=${data.order.id}`);
        } else {
          alert(`✅ Order created successfully!\n\nOrder number: ${data.order.orderNumber}\n\nPayment instructions will be sent to ${user.email}`);
          router.push(`/order-success?orderId=${data.order.id}`);
        }
      } else {
        const error = await res.json();
        console.error('Order error:', error);
        alert(`Error: ${error.error || 'Failed to create order'}`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to create order. Please try again.');
    }
    setLoading(false);
  };

  if (!cart || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Checkout</h1>
            <div className="text-sm text-gray-600">
              Logged in as: {user.email}
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className={`px-3 py-1 rounded ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              1. Delivery
            </div>
            <div className={`px-3 py-1 rounded ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              2. Address
            </div>
            <div className={`px-3 py-1 rounded ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              3. Payment
            </div>
            <div className={`px-3 py-1 rounded ${step >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              4. Summary
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            
            {/* Step 1: Delivery Method */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Select Delivery Method</h2>
                <div className="space-y-3">
                  {deliveryMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`block p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedDelivery === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value={method.id}
                        checked={selectedDelivery === method.id}
                        onChange={() => handleDeliverySelect(method.id)}
                        className="sr-only"
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{method.icon}</span>
                            <span className="font-semibold">{method.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Delivery in {method.estimatedDays === 0 ? 'today' : `${method.estimatedDays} days`}
                          </p>
                        </div>
                        <span className="font-bold text-lg">
                          {method.price === 0 ? 'FREE' : `${method.price} Kč`}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Pickup points selection */}
                {(selectedDelivery === 'ZASILKOVNA' || selectedDelivery === 'PPL') && pickupPoints.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Select Pickup Point</h3>
                    <select
                      value={selectedPickupPoint}
                      onChange={(e) => setSelectedPickupPoint(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">-- Select pickup point --</option>
                      {pickupPoints.map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.name} - {point.address}, {point.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedDelivery || ((selectedDelivery === 'ZASILKOVNA' || selectedDelivery === 'PPL') && !selectedPickupPoint)}
                  className="mt-6 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Continue to Address
                </button>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
                
                {selectedDelivery === 'PERSONAL_PICKUP' ? (
                  <div>
                    <div className="p-4 bg-blue-50 rounded">
                      <p className="font-semibold">Pickup Location:</p>
                      <p>Knihkupectví a antikvariát Spálená 53</p>
                      <p>Spálená 53, 110 00 Praha 1</p>
                      <p className="text-sm text-gray-600 mt-2">Opening hours: Mon-Fri 8:30-18:30, Sat 10:00-16:00</p>
                    </div>
                    <div className="mt-4 p-4 bg-green-50 rounded">
                      <p className="text-sm">✅ Order confirmation will be sent to: <strong>{user.email}</strong></p>
                    </div>
                  </div>
                ) : (selectedDelivery === 'ZASILKOVNA' || selectedDelivery === 'PPL' || selectedDelivery === 'DPD') ? (
                  <div>
                    <div className="p-4 bg-blue-50 rounded">
                      <p className="font-semibold">Selected Pickup Point:</p>
                      <p>{pickupPoints.find(p => p.id === selectedPickupPoint)?.name}</p>
                      <p>{pickupPoints.find(p => p.id === selectedPickupPoint)?.address}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {pickupPoints.find(p => p.id === selectedPickupPoint)?.openingHours}
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm mb-2">Phone number for pickup notification (optional):</p>
                      <input
                        type="tel"
                        placeholder="Phone Number (optional)"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="mt-4 p-4 bg-green-50 rounded">
                      <p className="text-sm">✅ Pickup code will be sent to: <strong>{user.email}</strong></p>
                    </div>
                  </div>
                ) : (
                  // Czech Post - Home delivery
                  <div>
                    <h3 className="font-semibold mb-3">Delivery Address</h3>
                    
                    {userAddresses.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Use saved address:</label>
                        <select
                          value={selectedAddressId}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          {userAddresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.street}, {addr.city} {addr.postalCode}
                            </option>
                          ))}
                          <option value="new">Enter new address</option>
                        </select>
                      </div>
                    )}

                    {(selectedAddressId === 'new' || userAddresses.length === 0) && (
                      <form className="space-y-4">
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                          className="w-full p-2 border rounded"
                          required
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            className="p-2 border rounded"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
                            className="p-2 border rounded"
                            required
                          />
                        </div>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </form>
                    )}
                    
                    <div className="mt-4 p-4 bg-green-50 rounded">
                      <p className="text-sm">✅ Delivery to: <strong>{user.firstName} {user.lastName}</strong></p>
                      <p className="text-sm">📧 Confirmation to: <strong>{user.email}</strong></p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      // Validate Czech Post address if needed
                      if (selectedDelivery === 'CZECH_POST' && (selectedAddressId === 'new' || !selectedAddressId)) {
                        if (!newAddress.street || !newAddress.city || !newAddress.postalCode || !newAddress.phone) {
                          alert('Please fill in all address fields');
                          return;
                        }
                      }
                      setStep(3);
                    }}
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className={`block p-4 border rounded-lg cursor-pointer ${
                    selectedPayment === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="CARD"
                      checked={selectedPayment === 'CARD'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💳</span>
                      <div>
                        <p className="font-semibold">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Pay securely with Stripe</p>
                      </div>
                    </div>
                  </label>

                  <label className={`block p-4 border rounded-lg cursor-pointer ${
                    selectedPayment === 'BANK_TRANSFER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="BANK_TRANSFER"
                      checked={selectedPayment === 'BANK_TRANSFER'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏦</span>
                      <div>
                        <p className="font-semibold">Bank Transfer</p>
                        <p className="text-sm text-gray-600">Pay by bank transfer</p>
                      </div>
                    </div>
                  </label>

                  <label className={`block p-4 border rounded-lg cursor-pointer ${
                    selectedPayment === 'CASH_ON_DELIVERY' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="CASH_ON_DELIVERY"
                      checked={selectedPayment === 'CASH_ON_DELIVERY'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💵</span>
                      <div>
                        <p className="font-semibold">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when you receive the package (+30 Kč)</p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Customer</h3>
                    <p>{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Delivery</h3>
                    <p>{deliveryMethods.find(m => m.id === selectedDelivery)?.name}</p>
                    {selectedPickupPoint && (
                      <p className="text-sm text-gray-600">
                        {pickupPoints.find(p => p.id === selectedPickupPoint)?.name}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <p>{selectedPayment.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <h3 className="font-semibold mb-4">Order Details</h3>
              
              <div className="space-y-2 mb-4">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product.title} × {item.quantity}</span>
                    <span>{(item.product.salePrice || item.product.price) * item.quantity} Kč</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{cart.items.reduce((sum: number, item: any) => 
                    sum + (item.product.salePrice || item.product.price) * item.quantity, 0)} Kč</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{deliveryMethods.find(m => m.id === selectedDelivery)?.price || 0} Kč</span>
                </div>
                {selectedPayment === 'CASH_ON_DELIVERY' && (
                  <div className="flex justify-between">
                    <span>COD Fee:</span>
                    <span>30 Kč</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{calculateTotal() + (selectedPayment === 'CASH_ON_DELIVERY' ? 30 : 0)} Kč</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}