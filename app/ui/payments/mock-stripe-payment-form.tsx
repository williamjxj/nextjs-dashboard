"use client";

import { Button } from "@/app/ui/button";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface MockStripePaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function MockStripePaymentForm({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
}: MockStripePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate card number
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
      setError("Please enter a valid card number");
      setIsLoading(false);
      return;
    }

    // Validate expiry
    if (!expiry || expiry.length < 5) {
      setError("Please enter a valid expiry date");
      setIsLoading(false);
      return;
    }

    // Validate CVC
    if (!cvc || cvc.length < 3) {
      setError("Please enter a valid CVC");
      setIsLoading(false);
      return;
    }

    try {
      console.log('🧪 Mock payment processing...');
      console.log('Card:', cardNumber.replace(/\s/g, "").slice(0, 4) + '****');
      console.log('Amount:', amount, currency);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test different card numbers for different outcomes
      const cleanCardNumber = cardNumber.replace(/\s/g, "");
      
      if (cleanCardNumber.startsWith("4242424242424242")) {
        // Success case
        console.log('✅ Mock payment succeeded!');
        onSuccess();
      } else if (cleanCardNumber.startsWith("4000000000000002")) {
        // Declined case
        console.log('❌ Mock payment declined');
        setError("Your card was declined. Please try a different payment method.");
        onError("Your card was declined. Please try a different payment method.");
      } else if (cleanCardNumber.startsWith("4000000000000069")) {
        // Expired card
        console.log('❌ Mock payment failed - expired card');
        setError("Your card has expired. Please use a different card.");
        onError("Your card has expired. Please use a different card.");
      } else if (cleanCardNumber.startsWith("4000000000009995")) {
        // Insufficient funds
        console.log('❌ Mock payment failed - insufficient funds');
        setError("Your card has insufficient funds. Please try a different card.");
        onError("Your card has insufficient funds. Please try a different card.");
      } else {
        // Default success for any other card
        console.log('✅ Mock payment succeeded (default)!');
        onSuccess();
      }
    } catch (err) {
      console.error('Mock payment error:', err);
      setError("An unexpected error occurred");
      onError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-blue-800 mb-2">🧪 Mock Payment Form</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Test Cards:</strong></p>
          <p>• Success: 4242 4242 4242 4242</p>
          <p>• Declined: 4000 0000 0000 0002</p>
          <p>• Expired: 4000 0000 0000 0069</p>
          <p>• Insufficient funds: 4000 0000 0000 9995</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP
            </label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="12345"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={5}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Payment Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Total Amount:
          </span>
          <span className="text-lg font-bold text-gray-900">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency.toUpperCase(),
            }).format(amount / 100)}
          </span>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.toUpperCase(),
          }).format(amount / 100)}`
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>🧪 This is a mock payment form for development testing.</p>
        <p>No real payments will be processed.</p>
      </div>
    </form>
  );
}
