import React, { useState } from "react";

interface FoodItem {
  name: string;
  Price: number;
}

interface OrderItem {
  foodItem: FoodItem;
  quantity: number;
}

interface Order {
  _id: string;
  pickupLocation?: string;
  items: OrderItem[];
  status?: string;
  createdAt?: string;
  price?: number;
  total?: number;
  serviceFee?: number;
}

interface ReceiptProps {
  order: Order;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  loading?: boolean;
  compact?: boolean;
}

export default function Receipt({
  order,
  onComplete,
  showCompleteButton = true,
  loading = false,
  compact = false
}: ReceiptProps) {
  const total = order.items.reduce(
    (sum, item) => sum + item.foodItem.Price * item.quantity,
    0
  );

  return (
    <div className={`w-full ${compact ? '' : 'min-h-screen'} flex justify-center items-center ${compact ? '' : 'bg-gray-50 p-4'}`}>
      {/* Border wrapper with torn edge */}
      <div className="relative w-96 bg-black rounded-t-lg p-[3px]" style={{
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 16px), 94% 100%, 88% calc(100% - 16px), 82% 100%, 76% calc(100% - 16px), 70% 100%, 64% calc(100% - 16px), 58% 100%, 52% calc(100% - 16px), 46% 100%, 40% calc(100% - 16px), 34% 100%, 28% calc(100% - 16px), 22% 100%, 16% calc(100% - 16px), 10% 100%, 4% calc(100% - 16px), 0 calc(100% - 16px))",
        boxShadow: "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.1)"
      }}>
        {/* Inner white receipt */}
        <div className="relative w-full bg-white text-black rounded-t-lg" style={{
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 16px), 94% 100%, 88% calc(100% - 16px), 82% 100%, 76% calc(100% - 16px), 70% 100%, 64% calc(100% - 16px), 58% 100%, 52% calc(100% - 16px), 46% 100%, 40% calc(100% - 16px), 34% 100%, 28% calc(100% - 16px), 22% 100%, 16% calc(100% - 16px), 10% 100%, 4% calc(100% - 16px), 0 calc(100% - 16px))",
          boxShadow: "inset 0 0 60px rgba(255, 255, 255, 1)"
        }}>
          {/* Header */}
          <div className="p-6 text-center border-b border-gray-200">
            <h1 className="text-2xl font-black mb-1">RECEIPT</h1>
            <p className="text-xs text-gray-500">Order ID</p>
            <p className="text-sm font-bold">{order._id}</p>
          </div>

          {/* Info Section */}
          <div className="flex border-b border-gray-200">
            <div className="flex-1 p-4 border-r border-gray-200 text-center">
              <p className="text-xs text-gray-500">Pickup Location</p>
              <p className="font-bold">{order.pickupLocation || 'N/A'}</p>
            </div>

            <div className="flex-1 p-4 text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold">{total} EGP</p>
            </div>
          </div>

          {/* Items */}
          <div className="p-6 pb-8">
            <h2 className="text-sm font-extrabold mb-3">Items</h2>

            <div className="flex flex-col gap-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 border border-gray-200 rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">{item.foodItem.name}</p>
                    <p className="text-xs text-gray-600">x{item.quantity}</p>
                  </div>
                  <p className="font-bold">
                    {item.foodItem.Price * item.quantity} EGP
                  </p>
                </div>
              ))}
            </div>

            {/* Complete Button */}
            {showCompleteButton && order.status !== 'Completed' && (
              <button
                onClick={onComplete}
                disabled={loading}
                className="w-full mt-6 mb-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Complete Order
                  </>
                )}
              </button>
            )}

            {order.status === 'Completed' && (
              <div className="w-full mt-6 mb-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Order Completed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}