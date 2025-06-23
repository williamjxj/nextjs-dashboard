"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface PaymentStatusProps {
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "REQUIRES_ACTION";
  amount?: number;
  currency?: string;
  paymentMethod?: "STRIPE" | "PAYPAL" | "BANK_TRANSFER" | "CASH";
  createdAt?: Date;
  className?: string;
}

export default function PaymentStatus({
  status,
  amount,
  currency = "USD",
  paymentMethod,
  createdAt,
  className = "",
}: PaymentStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "SUCCEEDED":
        return {
          icon: CheckCircleIcon,
          color: "text-green-600",
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
          label: "Paid",
          description: "Payment completed successfully",
        };
      case "FAILED":
        return {
          icon: XCircleIcon,
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
          label: "Failed",
          description: "Payment failed",
        };
      case "CANCELLED":
        return {
          icon: XCircleIcon,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
          label: "Cancelled",
          description: "Payment was cancelled",
        };
      case "PROCESSING":
        return {
          icon: ClockIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-200",
          label: "Processing",
          description: "Payment is being processed",
        };
      case "REQUIRES_ACTION":
        return {
          icon: ExclamationTriangleIcon,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          borderColor: "border-yellow-200",
          label: "Action Required",
          description: "Additional verification needed",
        };
      case "PENDING":
      default:
        return {
          icon: ClockIcon,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
          label: "Pending",
          description: "Awaiting payment",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return safeFormatDateTime(date);
  };

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </p>
            {amount && (
              <p className="text-sm font-semibold text-gray-900">
                {formatAmount(amount)}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{config.description}</p>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            {paymentMethod && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-white border border-gray-200">
                {paymentMethod === "STRIPE"
                  ? "Card"
                  : paymentMethod === "PAYPAL"
                  ? "PayPal"
                  : paymentMethod === "BANK_TRANSFER"
                  ? "Bank Transfer"
                  : "Cash"}
              </span>
            )}
            {createdAt && <span>{formatDate(createdAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
