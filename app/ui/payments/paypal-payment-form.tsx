"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

interface PayPalPaymentFormProps {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess: (details: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

export default function PayPalPaymentForm({
  orderId,
  amount,
  currency,
  onSuccess,
  onError,
  onCancel,
}: PayPalPaymentFormProps) {
  // Debug logging
  console.log("🟡 PayPal form rendered with:", {
    orderId,
    amount,
    currency,
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.slice(0, 20) + "...",
  });

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: currency.toUpperCase(),
    intent: "capture" as const,
    components: "buttons" as const,
  };

  // Debug PayPal options
  console.log("🟡 PayPal options:", initialOptions);

  const createOrder = () => {
    console.log("Creating PayPal order with ID:", orderId);
    // Return the existing order ID
    return Promise.resolve(orderId);
  };

  const onApprove = async (data: any) => {
    console.log("PayPal payment approved. Data:", data);
    try {
      // Call our server to capture the payment
      console.log(
        "Sending request to capture payment for orderId:",
        data.orderID
      );
      const response = await fetch("/api/payments/paypal/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      console.log("Capture request response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to capture payment. Server response:", errorText);
        throw new Error(`Failed to capture payment: ${errorText}`);
      }

      const details = await response.json();
      console.log("Payment captured successfully. Details:", details);
      onSuccess(details);
    } catch (error) {
      console.error("PayPal capture error:", error);
      onError("Failed to complete payment. Please try again.");
    }
  };

  const onErrorHandler = (err: any) => {
    console.error("PayPal error:", err);
    onError("PayPal payment failed. Please try again.");
  };

  const onCancelHandler = () => {
    console.log("PayPal payment cancelled by user.");
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Total Amount:
          </span>
          <span className="text-lg font-bold text-gray-900">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency.toUpperCase(),
            }).format(amount)}
          </span>
        </div>
      </div>

      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={onCancelHandler}
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 45,
          }}
          forceReRender={[orderId, amount, currency]}
        />
      </PayPalScriptProvider>

      <div className="text-xs text-gray-500 text-center">
        <p>You will be redirected to PayPal to complete your payment.</p>
        <p>Your payment information is secure and protected.</p>
      </div>
    </div>
  );
}
