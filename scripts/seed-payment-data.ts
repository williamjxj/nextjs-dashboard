import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPaymentData() {
  try {
    console.log("🌱 Seeding payment test data...");

    // Get existing invoices
    const invoices = await prisma.invoice.findMany({
      include: { customer: true },
    });

    if (invoices.length === 0) {
      console.log("No invoices found. Please seed invoices first.");
      return;
    }

    // Create test payments for some invoices
    const testPayments = [
      {
        invoiceId: invoices[0].id,
        amount: Math.floor(invoices[0].amount * 0.5), // Partial payment
        currency: "USD",
        status: "SUCCEEDED" as const,
        paymentMethod: "STRIPE" as const,
        stripePaymentIntentId: "pi_test_1234567890",
        stripeChargeId: "ch_test_1234567890",
        description: "Partial payment via credit card",
        receiptEmail: invoices[0].customer.email,
        receiptUrl: "https://dashboard.stripe.com/test/receipts/ch_test_1234567890",
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        invoiceId: invoices[1]?.id || invoices[0].id,
        amount: invoices[1]?.amount || invoices[0].amount,
        currency: "USD",
        status: "SUCCEEDED" as const,
        paymentMethod: "PAYPAL" as const,
        paypalOrderId: "ORDER123456789",
        paypalCaptureId: "CAPTURE123456789",
        description: "Full payment via PayPal",
        receiptEmail: invoices[1]?.customer.email || invoices[0].customer.email,
        paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        invoiceId: invoices[2]?.id || invoices[0].id,
        amount: 5000, // $50.00
        currency: "USD",
        status: "FAILED" as const,
        paymentMethod: "STRIPE" as const,
        stripePaymentIntentId: "pi_test_failed_123",
        description: "Failed payment attempt",
        failureReason: "Your card was declined. Please try a different payment method.",
        receiptEmail: invoices[2]?.customer.email || invoices[0].customer.email,
      },
      {
        invoiceId: invoices[3]?.id || invoices[0].id,
        amount: 2500, // $25.00
        currency: "USD",
        status: "PENDING" as const,
        paymentMethod: "STRIPE" as const,
        stripePaymentIntentId: "pi_test_pending_456",
        description: "Pending payment",
        receiptEmail: invoices[3]?.customer.email || invoices[0].customer.email,
      },
    ];

    // Create payments
    const createdPayments = [];
    for (const paymentData of testPayments) {
      const payment = await prisma.payment.create({
        data: paymentData,
      });
      createdPayments.push(payment);
      console.log(`✅ Created payment: ${payment.id} (${payment.status})`);
    }

    // Create test refunds for successful payments
    const successfulPayments = createdPayments.filter(p => p.status === "SUCCEEDED");
    
    if (successfulPayments.length > 0) {
      const refundData = {
        paymentId: successfulPayments[0].id,
        amount: 1000, // $10.00 refund
        currency: "USD",
        status: "SUCCEEDED" as const,
        reason: "Customer requested refund",
        stripeRefundId: "re_test_1234567890",
        processedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      };

      const refund = await prisma.refund.create({
        data: refundData,
      });
      console.log(`✅ Created refund: ${refund.id} (${refund.status})`);
    }

    // Update invoice statuses based on payments
    for (const invoice of invoices) {
      const payments = await prisma.payment.findMany({
        where: { invoiceId: invoice.id },
      });

      const totalPaid = payments
        .filter(p => p.status === "SUCCEEDED")
        .reduce((sum, p) => sum + p.amount, 0);

      let newStatus: "PENDING" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED";

      if (totalPaid === 0) {
        newStatus = "PENDING";
      } else if (totalPaid >= invoice.amount) {
        newStatus = "PAID";
      } else {
        newStatus = "PARTIALLY_PAID";
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });

      console.log(`✅ Updated invoice ${invoice.id.slice(-8)} status to: ${newStatus}`);
    }

    // Create some payment methods for customers
    const customers = await prisma.customer.findMany();
    
    for (const customer of customers.slice(0, 2)) {
      await prisma.paymentMethod.create({
        data: {
          customerId: customer.id,
          type: "CARD",
          isDefault: true,
          cardLast4: "4242",
          cardBrand: "visa",
          cardExpMonth: 12,
          cardExpYear: 2025,
          stripePaymentMethodId: `pm_test_${customer.id.slice(-8)}`,
        },
      });
      console.log(`✅ Created payment method for customer: ${customer.name}`);
    }

    console.log("🎉 Payment test data seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding payment data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedPaymentData()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
