"use client";

import {
  createPayPalPayment,
  createStripePayment,
} from "@/app/lib/simple-payment-actions";
import { Button } from "@/app/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ModernStripePaymentForm from "./modern-stripe-payment-form";
import PaymentMethodSelector from "./payment-method-selector";
import PaymentStatus from "./payment-status";
import PayPalPaymentForm from "./paypal-payment-form";

interface PaymentFormProps {
  invoiceId: string;
  amount: number;
  currency?: string;
  description?: string;
  customerEmail?: string;
}

export default function PaymentForm({
  invoiceId,
  amount,
  currency = "USD",
  description,
  customerEmail,
}: PaymentFormProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<
    "STRIPE" | "PAYPAL" | null
  >(null);
  const [paymentStep, setPaymentStep] = useState<
    "select" | "pay" | "success" | "error"
  >("select");
  const [paymentData, setPaymentData] = useState<{
    id: string;
    clientSecret?: string;
    amount?: number;
    currency?: string;
    status?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleMethodSelect = (method: "STRIPE" | "PAYPAL") => {
    setSelectedMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!selectedMethod) return;

    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("invoiceId", invoiceId);
    formData.append("amount", amount.toString());
    formData.append("currency", currency);
    formData.append(
      "description",
      description || `Payment for invoice ${invoiceId}`
    );
    if (customerEmail) {
      formData.append("receiptEmail", customerEmail);
    }

    try {
      if (selectedMethod === "STRIPE") {
        const result = await createStripePayment({}, formData);

        if (result.success && result.paymentIntent) {
          setPaymentData(result.paymentIntent);
          setPaymentStep("pay");
        } else {
          setErrorMessage(result.message || "Failed to create payment");
          setPaymentStep("error");
        }
      } else if (selectedMethod === "PAYPAL") {
        const result = await createPayPalPayment({}, formData);

        if (result.success && result.paypalOrder) {
          setPaymentData(result.paypalOrder);
          setPaymentStep("pay");
        } else {
          setErrorMessage(result.message || "Failed to create PayPal order");
          setPaymentStep("error");
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred");
      setPaymentStep("error");
    } finally {
      setIsPending(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentStep("success");
    setTimeout(() => {
      router.push(`/dashboard/invoices/${invoiceId}`);
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setErrorMessage(error);
    setPaymentStep("error");
  };

  const handleBackToSelect = () => {
    setPaymentStep("select");
    setSelectedMethod(null);
    setPaymentData(null);
    setErrorMessage(null);
  };

  const handleCancel = () => {
    router.push(`/dashboard/invoices/${invoiceId}`);
  };

  const handleContinueAfterSuccess = () => {
    router.push(`/dashboard/invoices/${invoiceId}`);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href={`/dashboard/invoices/${invoiceId}`}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Invoice
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
        <p className="text-sm text-gray-600 mt-1">
          Complete your payment for invoice #{invoiceId.slice(-8)}
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Amount due: </span>
            {formatAmount(amount)}
          </p>
        </div>
      </div>

      {/* Payment Steps */}
      {paymentStep === "select" && (
        <div className="space-y-6">
          <PaymentMethodSelector
            onMethodSelect={handleMethodSelect}
            selectedMethod={selectedMethod || undefined}
          />

          {selectedMethod && (
            <div className="flex space-x-3">
              <Button
                onClick={handleProceedToPayment}
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? "Processing..." : "Continue to Payment"}
              </Button>
              <Button
                className="bg-gray-500 hover:bg-gray-400 active:bg-gray-600"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {paymentStep === "pay" &&
        selectedMethod === "STRIPE" &&
        paymentData &&
        paymentData.clientSecret && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBackToSelect}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-medium text-gray-900">
                Pay with Credit Card
              </h3>
            </div>

            <ModernStripePaymentForm
              clientSecret={paymentData.clientSecret}
              amount={paymentData.amount || amount}
              currency={paymentData.currency || currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        )}

      {paymentStep === "pay" && selectedMethod === "PAYPAL" && paymentData && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBackToSelect}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-medium text-gray-900">
              Pay with PayPal
            </h3>
          </div>

          <PayPalPaymentForm
            orderId={paymentData.id}
            amount={amount}
            currency={currency}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleBackToSelect}
          />
        </div>
      )}

      {paymentStep === "success" && (
        <div className="text-center space-y-6">
          <PaymentStatus
            status="SUCCEEDED"
            amount={amount * 100}
            currency={currency}
            paymentMethod={selectedMethod || undefined}
            createdAt={new Date()}
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600 mb-2">
              Your payment has been processed successfully. You will receive a
              confirmation email shortly.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to invoice details in 3 seconds...
            </p>
          </div>

          <Button onClick={handleContinueAfterSuccess}>Continue</Button>
        </div>
      )}

      {paymentStep === "error" && (
        <div className="text-center space-y-6">
          <PaymentStatus
            status="FAILED"
            amount={amount * 100}
            currency={currency}
            paymentMethod={selectedMethod || undefined}
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Payment Failed
            </h3>
            <p className="text-gray-600 mb-4">
              {errorMessage ||
                "Something went wrong with your payment. Please try again."}
            </p>
          </div>

          <div className="flex space-x-3 justify-center">
            <Button onClick={handleBackToSelect}>Try Again</Button>
            <Button
              className="bg-gray-500 hover:bg-gray-400 active:bg-gray-600"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
