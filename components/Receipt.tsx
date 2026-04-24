"use client"
import { Order } from '@/types';

interface ReceiptProps {
  order: Order;
  onClose?: () => void;
}

export default function Receipt({ order, onClose }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-content, .receipt-content * {
            visibility: visible;
          }
          .receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="receipt-content">
            {/* Receipt Header */}
            <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
              <h2 className="text-2xl font-bold text-gray-900">Spin Fresh Laundry Shop</h2>
              <p className="text-sm text-gray-600 mt-1">Professional Laundry Services</p>
              <p className="text-xs text-gray-500 mt-1">Brgy. Sta. Maria, Calauag, Quezon</p>
              <p className="text-xs text-gray-500">Cellphone Number: 0931-006-4624</p>
            </div>

            {/* Order Info */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-black">ORDER #:</span>
                <span className="text-sm font-mono text-black">{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-black">DATE:</span>
                <span className="text-sm text-black">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-black">STATUS:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 border-t border-b border-gray-300 py-3">
              <h3 className="text-sm font-bold mb-2 text-black">CUSTOMER INFORMATION</h3>
              <div className="space-y-1">
                <div className="flex">
                  <span className="text-sm font-semibold w-20 text-black">Name:</span>
                  <span className="text-sm text-gray-900">{order.customer.name}</span>
                </div>
                <div className="flex">
                  <span className="text-sm font-semibold w-20 text-black">Contact:</span>
                  <span className="text-sm text-gray-900">{order.customer.contact_number}</span>
                </div>
                <div className="flex">
                  <span className="text-sm font-semibold w-20 text-black">Address:</span>
                  <span className="text-sm text-gray-900">{order.customer.address}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="mb-4">
              <h3 className="text-sm font-bold mb-2 text-black">ORDER DETAILS</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-900">Laundry Service</span>
                    <span className="text-xs text-gray-700 block">Weight: {order.weight} kg</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">PHP {order.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-800 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-black">TOTAL:</span>
                <span className="text-lg font-bold text-black">PHP {order.total_price.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-300 text-center">
              <p className="text-xs text-gray-700 mb-2">Thank you for your business!</p>
              <p className="text-xs text-gray-600">Please keep this receipt for your records.</p>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-600">Payment Terms: Cash </p>
                
              </div>
            </div>
          </div>

          {/* Action Buttons - Hidden when printing */}
          <div className="flex justify-end space-x-3 mt-6 no-print">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Print Receipt
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
