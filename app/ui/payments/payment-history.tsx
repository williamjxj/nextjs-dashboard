"use client";

import { safeFormatDateTime } from "@/app/lib/date-utils";
import { Button } from "@/app/ui/button";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import PaymentStatus from "./payment-status";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "REQUIRES_ACTION"
    | "REQUIRES_CONFIRMATION";
  paymentMethod: "STRIPE" | "PAYPAL" | "BANK_TRANSFER" | "CASH";
  description?: string;
  receiptUrl?: string;
  failureReason?: string;
  createdAt: Date;
  paidAt?: Date;
  refunds?: Refund[];
}

interface Refund {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  reason?: string;
  createdAt: Date;
  processedAt?: Date;
}

interface PaymentHistoryProps {
  payments: Payment[];
  onRefund?: (paymentId: string, amount?: number, reason?: string) => void;
  showRefundButton?: boolean;
}

export default function PaymentHistory({
  payments,
  onRefund,
  showRefundButton = false,
}: PaymentHistoryProps) {
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(
    new Set()
  );
  const [refundingPayment, setRefundingPayment] = useState<string | null>(null);

  const toggleExpanded = (paymentId: string) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedPayments(newExpanded);
  };

  const handleRefund = (paymentId: string) => {
    if (onRefund) {
      onRefund(paymentId);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return safeFormatDateTime(date);
  };

  const getPaymentMethodDisplay = (
    method: "STRIPE" | "PAYPAL" | "BANK_TRANSFER" | "CASH"
  ) => {
    switch (method) {
      case "STRIPE":
        return "Credit Card";
      case "PAYPAL":
        return "PayPal";
      case "BANK_TRANSFER":
        return "Bank Transfer";
      case "CASH":
        return "Cash";
      default:
        return method;
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No payments</h3>
        <p className="mt-1 text-sm text-gray-500">
          No payment history available for this invoice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Payment History</h3>

      <div className="space-y-3">
        {payments.map((payment) => {
          const isExpanded = expandedPayments.has(payment.id);
          const hasRefunds = payment.refunds && payment.refunds.length > 0;
          const totalRefunded = hasRefunds
            ? payment.refunds
                .filter((r) => r.status === "SUCCEEDED")
                .reduce((sum, r) => sum + r.amount, 0)
            : 0;

          return (
            <div
              key={payment.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Main Payment Row */}
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <PaymentStatus
                        status={payment.status}
                        amount={payment.amount}
                        currency={payment.currency}
                        paymentMethod={payment.paymentMethod}
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {payment.description ||
                            `Payment #${payment.id.slice(-8)}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getPaymentMethodDisplay(payment.paymentMethod)} •{" "}
                          {formatDate(payment.createdAt)}
                        </p>
                        {totalRefunded > 0 && (
                          <p className="text-sm text-red-600">
                            Refunded:{" "}
                            {formatAmount(totalRefunded, payment.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {payment.receiptUrl && (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Receipt
                      </a>
                    )}

                    {showRefundButton && payment.status === "SUCCEEDED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRefund(payment.id)}
                        disabled={refundingPayment === payment.id}
                      >
                        {refundingPayment === payment.id ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          "Refund"
                        )}
                      </Button>
                    )}

                    {(hasRefunds || payment.failureReason) && (
                      <button
                        onClick={() => toggleExpanded(payment.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Failure Reason */}
                {payment.failureReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-red-800">
                          Payment Failed
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          {payment.failureReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && hasRefunds && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Refunds
                  </h4>
                  <div className="space-y-2">
                    {payment.refunds!.map((refund) => (
                      <div
                        key={refund.id}
                        className="flex items-center justify-between p-3 bg-white rounded border"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatAmount(refund.amount, refund.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {refund.reason && `${refund.reason} • `}
                            {formatDate(refund.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            refund.status === "SUCCEEDED"
                              ? "bg-green-100 text-green-800"
                              : refund.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {refund.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
