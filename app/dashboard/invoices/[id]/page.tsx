import { safeFormatDate } from "@/app/lib/date-utils";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import {
  DeleteInvoice,
  PayInvoice,
  UpdateInvoice,
} from "@/app/ui/invoices/buttons";
import PaymentHistory from "@/app/ui/payments/payment-history";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: "Invoice Details",
};

async function getInvoiceWithPayments(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: {
          include: {
            refunds: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return invoice;
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return null;
  }
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const resolvedParams = await params;
  const invoice = await getInvoiceWithPayments(resolvedParams.id);

  if (!invoice) {
    notFound();
  }

  // Calculate payment summary
  const totalPaid = invoice.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalRefunded = invoice.payments
    .flatMap((p) => p.refunds)
    .filter((r) => r.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + refund.amount, 0);

  const netPaid = totalPaid - totalRefunded;
  const remainingAmount = invoice.amount - netPaid;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return safeFormatDate(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PARTIALLY_PAID":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6">
      <Breadcrumbs
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: `Invoice #${invoice.id.slice(-8)}`,
            href: `/dashboard/invoices/${invoice.id}`,
            active: true,
          },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Invoice #{invoice.id.slice(-8)}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Created on {formatDate(invoice.date)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status.replace("_", " ")}
                </span>
                <div className="flex space-x-1">
                  <PayInvoice id={invoice.id} status={invoice.status} />
                  <UpdateInvoice id={invoice.id} />
                  <DeleteInvoice id={invoice.id} />
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Bill To:
                </h3>
                <div className="text-sm text-gray-900">
                  <p className="font-medium">{invoice.customer.name}</p>
                  <p>{invoice.customer.email}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Invoice Details:
                </h3>
                <div className="text-sm text-gray-900 space-y-1">
                  <div className="flex justify-between">
                    <span>Invoice Date:</span>
                    <span>{formatDate(invoice.date)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Description:
                </h3>
                <p className="text-sm text-gray-900">{invoice.description}</p>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Notes:
                </h3>
                <p className="text-sm text-gray-900">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <PaymentHistory
              payments={invoice.payments.map((payment) => ({
                ...payment,
                description: payment.description || undefined,
                receiptUrl: payment.receiptUrl || undefined,
                receiptEmail: payment.receiptEmail || undefined,
                stripePaymentIntentId:
                  payment.stripePaymentIntentId || undefined,
                paypalOrderId: payment.paypalOrderId || undefined,
                failureReason: payment.failureReason || undefined,
                createdAt: new Date(payment.createdAt),
                paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
                refunds: payment.refunds?.map((refund) => ({
                  ...refund,
                  reason: refund.reason || undefined,
                  stripeRefundId: refund.stripeRefundId || undefined,
                  paypalRefundId: refund.paypalRefundId || undefined,
                  createdAt: new Date(refund.createdAt),
                  processedAt: refund.processedAt
                    ? new Date(refund.processedAt)
                    : undefined,
                })),
              }))}
              showRefundButton={true}
            />
          </div>
        </div>

        {/* Sidebar - Payment Summary */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Payment Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice Total:</span>
                <span className="font-medium">
                  {formatAmount(invoice.amount)}
                </span>
              </div>

              {totalPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-medium text-green-600">
                    {formatAmount(totalPaid)}
                  </span>
                </div>
              )}

              {totalRefunded > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Refunded:</span>
                  <span className="font-medium text-red-600">
                    -{formatAmount(totalRefunded)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">
                    {remainingAmount > 0 ? "Amount Due:" : "Net Paid:"}
                  </span>
                  <span
                    className={`text-base font-bold ${
                      remainingAmount > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatAmount(
                      remainingAmount > 0 ? remainingAmount : netPaid
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {remainingAmount > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <PayInvoice id={invoice.id} status={invoice.status} />
                <p className="text-xs text-gray-500 mt-2">
                  Click to make a payment on this invoice
                </p>
              </div>
            )}
          </div>

          {/* Payment Methods Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Accepted Payment Methods
            </h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• Credit/Debit Cards (Visa, Mastercard, Amex)</p>
              <p>• PayPal</p>
              <p>• Secure payment processing</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
