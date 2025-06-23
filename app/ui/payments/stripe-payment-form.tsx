"use client";

import { Button } from "@/app/ui/button";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Debug logging
console.log(
  "Stripe publishable key:",
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.slice(0, 20) + "..."
);

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setIsLoading(false);
      return;
    }

    try {
      console.log(
        "Attempting payment with client secret:",
        clientSecret?.slice(0, 20) + "..."
      );

      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      console.log("Payment result:", {
        confirmError,
        paymentIntentStatus: paymentIntent?.status,
      });

      if (confirmError) {
        console.error("Stripe payment error:", confirmError);
        setError(confirmError.message || "Payment failed");
        onError(confirmError.message || "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        console.log("Payment succeeded!");
        onSuccess();
      } else {
        console.log("Payment status:", paymentIntent?.status);
        setError(`Payment status: ${paymentIntent?.status}`);
        onError(`Payment status: ${paymentIntent?.status}`);
      }
    } catch (err) {
      console.error("Unexpected payment error:", err);
      setError(
        `An unexpected error occurred: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      onError(
        `An unexpected error occurred: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded-md bg-white">
          <CardElement options={cardElementOptions} />
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

      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
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
        <p>Your payment information is secure and encrypted.</p>
        <p>Powered by Stripe</p>
      </div>
    </form>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
