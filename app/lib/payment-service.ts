import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
}

export class PaymentService {
  // Stripe Payment Methods
  static async createStripePaymentIntent(
    amount: number,
    currency: string = "usd",
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      console.error("Stripe payment intent creation failed:", error);
      throw new Error("Failed to create payment intent");
    }
  }

  static async confirmStripePayment(
    paymentIntentId: string
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId
      );

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error("Stripe payment confirmation failed:", error);
      throw new Error("Failed to confirm payment");
    }
  }

  static async retrieveStripePayment(
    paymentIntentId: string
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error("Stripe payment retrieval failed:", error);
      throw new Error("Failed to retrieve payment");
    }
  }

  // Database Payment Operations
  static async createPaymentRecord(data: {
    invoiceId: string;
    amount: number;
    currency?: string;
    paymentMethod: "STRIPE" | "PAYPAL";
    stripePaymentIntentId?: string;
    paypalOrderId?: string;
    description?: string;
    receiptEmail?: string;
  }) {
    try {
      const payment = await prisma.payment.create({
        data: {
          invoiceId: data.invoiceId,
          amount: Math.round(data.amount * 100), // Store in cents
          currency: data.currency || "USD",
          paymentMethod: data.paymentMethod,
          stripePaymentIntentId: data.stripePaymentIntentId,
          paypalOrderId: data.paypalOrderId,
          description: data.description,
          receiptEmail: data.receiptEmail,
          status: "PENDING",
        },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
      });

      return payment;
    } catch (error) {
      console.error("Payment record creation failed:", error);
      throw new Error("Failed to create payment record");
    }
  }

  static async updatePaymentStatus(
    paymentId: string,
    status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED",
    metadata?: {
      stripeChargeId?: string;
      paypalCaptureId?: string;
      receiptUrl?: string;
      failureReason?: string;
      paidAt?: Date;
    }
  ) {
    try {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          stripeChargeId: metadata?.stripeChargeId,
          paypalCaptureId: metadata?.paypalCaptureId,
          receiptUrl: metadata?.receiptUrl,
          failureReason: metadata?.failureReason,
          paidAt: metadata?.paidAt,
        },
        include: {
          invoice: true,
        },
      });

      // Update invoice status if payment succeeded
      if (status === "SUCCEEDED") {
        await this.updateInvoiceStatus(payment.invoiceId);
      }

      return payment;
    } catch (error) {
      console.error("Payment status update failed:", error);
      throw new Error("Failed to update payment status");
    }
  }

  static async updateInvoiceStatus(invoiceId: string) {
    try {
      // Get all payments for this invoice
      const payments = await prisma.payment.findMany({
        where: { invoiceId },
      });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const totalPaid = payments
        .filter((p) => p.status === "SUCCEEDED")
        .reduce((sum, p) => sum + p.amount, 0);

      let newStatus:
        | "PENDING"
        | "PAID"
        | "PARTIALLY_PAID"
        | "OVERDUE"
        | "CANCELLED";

      if (totalPaid === 0) {
        newStatus = "PENDING";
      } else if (totalPaid >= invoice.amount) {
        newStatus = "PAID";
      } else {
        newStatus = "PARTIALLY_PAID";
      }

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      return newStatus;
    } catch (error) {
      console.error("Invoice status update failed:", error);
      throw new Error("Failed to update invoice status");
    }
  }

  static async getPaymentsByInvoice(invoiceId: string) {
    try {
      return await prisma.payment.findMany({
        where: { invoiceId },
        include: {
          refunds: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      throw new Error("Failed to fetch payments");
    }
  }

  // Refund Operations
  static async createStripeRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as "duplicate" | "fraudulent" | "requested_by_customer",
      });

      return {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      };
    } catch (error) {
      console.error("Stripe refund creation failed:", error);
      throw new Error("Failed to create refund");
    }
  }

  // PayPal Payment Methods
  static async createPayPalOrder(
    amount: number,
    currency: string = "USD",
    description?: string
  ): Promise<PayPalOrder> {
    try {
      const response = await fetch(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.getPayPalAccessToken()}`,
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: currency,
                  value: amount.toFixed(2),
                },
                description,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`PayPal API error: ${response.statusText}`);
      }

      const order = await response.json();
      return {
        id: order.id,
        status: order.status,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      };
    } catch (error) {
      console.error("PayPal order creation failed:", error);
      throw new Error("Failed to create PayPal order");
    }
  }

  static async capturePayPalOrder(orderId: string): Promise<PayPalOrder> {
    try {
      const response = await fetch(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.getPayPalAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`PayPal capture error: ${response.statusText}`);
      }

      const order = await response.json();
      return {
        id: order.id,
        status: order.status,
        amount: order.purchase_units[0].amount,
      };
    } catch (error) {
      console.error("PayPal order capture failed:", error);
      throw new Error("Failed to capture PayPal order");
    }
  }

  private static async getPayPalAccessToken(): Promise<string> {
    try {
      const response = await fetch(
        `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
          body: "grant_type=client_credentials",
        }
      );

      if (!response.ok) {
        throw new Error(`PayPal auth error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("PayPal authentication failed:", error);
      throw new Error("Failed to authenticate with PayPal");
    }
  }

  static async createRefundRecord(data: {
    paymentId: string;
    amount: number;
    currency?: string;
    reason?: string;
    stripeRefundId?: string;
    paypalRefundId?: string;
  }) {
    try {
      const refund = await prisma.refund.create({
        data: {
          paymentId: data.paymentId,
          amount: Math.round(data.amount * 100), // Store in cents
          currency: data.currency || "USD",
          reason: data.reason,
          stripeRefundId: data.stripeRefundId,
          paypalRefundId: data.paypalRefundId,
          status: "PENDING",
        },
        include: {
          payment: {
            include: {
              invoice: true,
            },
          },
        },
      });

      return refund;
    } catch (error) {
      console.error("Refund record creation failed:", error);
      throw new Error("Failed to create refund record");
    }
  }
}
