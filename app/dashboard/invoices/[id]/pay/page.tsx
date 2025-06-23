import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import PaymentForm from "@/app/ui/payments/payment-form";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: "Pay Invoice",
};

async function getInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: {
          where: {
            status: "SUCCEEDED",
          },
        },
      },
    });

    return invoice;
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return null;
  }
}

export default async function PayInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const resolvedParams = await params;
  const invoice = await getInvoice(resolvedParams.id);

  if (!invoice) {
    notFound();
  }

  // Calculate remaining amount to pay
  const totalPaid = invoice.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const remainingAmount = invoice.amount - totalPaid;

  // If invoice is already fully paid, redirect to invoice details
  if (remainingAmount <= 0) {
    redirect(`/dashboard/invoices/${invoice.id}`);
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Breadcrumbs
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: `Invoice #${invoice.id.slice(-8)}`,
            href: `/dashboard/invoices/${invoice.id}`,
          },
          {
            label: "Pay Invoice",
            href: `/dashboard/invoices/${invoice.id}/pay`,
            active: true,
          },
        ]}
      />

      <div className="mt-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          {/* Invoice Summary */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Pay Invoice #{invoice.id.slice(-8)}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span>{new Date(invoice.date).toLocaleDateString()}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "PARTIALLY_PAID"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {invoice.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Invoice Total:</span>
                  <span>${(invoice.amount / 100).toFixed(2)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid:</span>
                    <span>-${(totalPaid / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Amount Due:</span>
                  <span>${(remainingAmount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {invoice.description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Description:
                </h3>
                <p className="text-sm text-gray-900">{invoice.description}</p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <PaymentForm
            invoiceId={invoice.id}
            amount={remainingAmount / 100} // Convert from cents to dollars
            currency="USD"
            description={
              invoice.description ||
              `Payment for invoice #${invoice.id.slice(-8)}`
            }
            customerEmail={invoice.customer.email}
          />
        </div>
      </div>
    </main>
  );
}
