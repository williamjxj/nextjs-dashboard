"use client";

import { useState } from "react";
import { CreditCardIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/button";

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: "STRIPE" | "PAYPAL") => void;
  selectedMethod?: "STRIPE" | "PAYPAL";
  disabled?: boolean;
}

export default function PaymentMethodSelector({
  onMethodSelect,
  selectedMethod,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<"STRIPE" | "PAYPAL" | null>(
    selectedMethod || null
  );

  const handleSelect = (method: "STRIPE" | "PAYPAL") => {
    setSelected(method);
    onMethodSelect(method);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Choose Payment Method</h3>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Stripe/Credit Card Option */}
        <div
          className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
            selected === "STRIPE"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && handleSelect("STRIPE")}
        >
          <div className="flex items-center space-x-3">
            <CreditCardIcon className="h-6 w-6 text-gray-600" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Credit/Debit Card
              </h4>
              <p className="text-xs text-gray-500">
                Visa, Mastercard, American Express
              </p>
            </div>
          </div>
          {selected === "STRIPE" && (
            <div className="absolute top-2 right-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            </div>
          )}
        </div>

        {/* PayPal Option */}
        <div
          className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
            selected === "PAYPAL"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && handleSelect("PAYPAL")}
        >
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="currentColor"
              >
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81.394.45.67.96.837 1.507z"/>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">PayPal</h4>
              <p className="text-xs text-gray-500">
                Pay with your PayPal account
              </p>
            </div>
          </div>
          {selected === "PAYPAL" && (
            <div className="absolute top-2 right-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Bank Transfer Option (Future) */}
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 opacity-50">
        <div className="flex items-center space-x-3">
          <BanknotesIcon className="h-6 w-6 text-gray-400" />
          <div>
            <h4 className="text-sm font-medium text-gray-400">
              Bank Transfer
            </h4>
            <p className="text-xs text-gray-400">Coming soon</p>
          </div>
        </div>
      </div>

      {selected && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            {selected === "STRIPE"
              ? "You'll be redirected to a secure payment form to enter your card details."
              : "You'll be redirected to PayPal to complete your payment."}
          </p>
        </div>
      )}
    </div>
  );
}
