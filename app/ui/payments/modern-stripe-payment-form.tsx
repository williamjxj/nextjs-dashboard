"use client";

import { Button } from "@/app/ui/button";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface ModernStripePaymentFormProps {
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
}: ModernStripePaymentFormProps) {
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

    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Form validation failed");
        onError(submitError.message || "Form validation failed");
        setIsLoading(false);
        return;
      }

      // Confirm the payment with the client secret
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/invoices`,
        },
        redirect: "if_required", // Only redirect if required by payment method
      });

      if (confirmError) {
        setError(confirmError.message || "Payment confirmation failed");
        onError(confirmError.message || "Payment confirmation failed");
      } else {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(`An unexpected error occurred: ${errorMessage}`);
      onError(`An unexpected error occurred: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Information
        </label>
        <div className="p-3 border border-gray-300 rounded-md bg-white">
          <PaymentElement
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card", "apple_pay", "google_pay"],
            }}
          />
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

      <Button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full"
      >
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

export default function ModernStripePaymentForm(
  props: ModernStripePaymentFormProps
) {
  const options = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#0570de",
        colorBackground: "#ffffff",
        colorText: "#30313d",
        colorDanger: "#df1b41",
        fontFamily: "Ideal Sans, system-ui, sans-serif",
        spacingUnit: "2px",
        borderRadius: "4px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}
