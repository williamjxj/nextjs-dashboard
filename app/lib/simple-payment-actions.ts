"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { PaymentService } from "./payment-service";

// Simplified validation schemas
const PaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(["STRIPE", "PAYPAL"]),
  currency: z.string().default("USD"),
  description: z.string().optional(),
  receiptEmail: z.string().email().optional(),
});

export type PaymentState = {
  errors?: {
    invoiceId?: string[];
    amount?: string[];
    paymentMethod?: string[];
    currency?: string[];
    description?: string[];
    receiptEmail?: string[];
  };
  message?: string | null;
  success?: boolean;
  paymentIntent?: {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
  };
  paypalOrder?: {
    id: string;
    status: string;
  };
};

// Simplified Stripe Payment Intent Creation
export async function createStripePayment(
  prevState: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  try {
    // Basic authentication check
    const session = await auth();
    if (!session?.user) {
      return {
        message: "Authentication required. Please sign in.",
      };
    }

    const validatedFields = PaymentSchema.safeParse({
      invoiceId: formData.get("invoiceId"),
      amount: formData.get("amount"),
      paymentMethod: "STRIPE",
      currency: formData.get("currency") || "USD",
      description: formData.get("description"),
      receiptEmail: formData.get("receiptEmail"),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Missing or invalid fields. Failed to create payment.",
      };
    }

    const { invoiceId, amount, currency, description, receiptEmail } =
      validatedFields.data;

    // Create Stripe Payment Intent
    const paymentIntent = await PaymentService.createStripePaymentIntent(
      amount,
      currency.toLowerCase(),
      {
        invoiceId,
        description: description || `Payment for invoice ${invoiceId}`,
      }
    );

    // Create payment record in database
    const payment = await PaymentService.createPaymentRecord({
      invoiceId,
      amount,
      currency,
      paymentMethod: "STRIPE",
      stripePaymentIntentId: paymentIntent.id,
      description,
      receiptEmail,
    });

    console.log(`✅ Stripe payment created: ${payment.id}`);

    return {
      success: true,
      message: "Payment intent created successfully",
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    };
  } catch (error) {
    console.error("Stripe payment creation failed:", error);
    return {
      message: "Failed to create payment. Please try again.",
    };
  }
}

// Simplified PayPal Order Creation
export async function createPayPalPayment(
  prevState: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  try {
    // Basic authentication check
    const session = await auth();
    if (!session?.user) {
      return {
        message: "Authentication required. Please sign in.",
      };
    }

    const validatedFields = PaymentSchema.safeParse({
      invoiceId: formData.get("invoiceId"),
      amount: formData.get("amount"),
      paymentMethod: "PAYPAL",
      currency: formData.get("currency") || "USD",
      description: formData.get("description"),
      receiptEmail: formData.get("receiptEmail"),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Missing or invalid fields. Failed to create payment.",
      };
    }

    const { invoiceId, amount, currency, description, receiptEmail } =
      validatedFields.data;

    // For now, return a mock PayPal order since credentials need setup
    console.log("⚠️ PayPal payment attempted - using mock response");
    
    return {
      success: false,
      message: "PayPal payments are currently unavailable. Please use Stripe instead.",
    };

    // Uncomment when PayPal credentials are properly configured:
    /*
    const paypalOrder = await PaymentService.createPayPalOrder(
      amount,
      currency,
      description || `Payment for invoice ${invoiceId}`
    );

    const payment = await PaymentService.createPaymentRecord({
      invoiceId,
      amount,
      currency,
      paymentMethod: "PAYPAL",
      paypalOrderId: paypalOrder.id,
      description,
      receiptEmail,
    });

    return {
      success: true,
      message: "PayPal order created successfully",
      paypalOrder: {
        id: paypalOrder.id,
        status: paypalOrder.status,
      },
    };
    */
  } catch (error) {
    console.error("PayPal payment creation failed:", error);
    return {
      message: "Failed to create PayPal payment. Please try again.",
    };
  }
}

// Confirm Stripe Payment
export async function confirmStripePayment(paymentIntentId: string) {
  try {
    const paymentIntent = await PaymentService.retrieveStripePayment(
      paymentIntentId
    );

    // Update payment status in database
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find(
      (p) => p.stripePaymentIntentId === paymentIntentId
    );

    if (payment) {
      await PaymentService.updatePaymentStatus(
        payment.id,
        paymentIntent.status === "succeeded" ? "SUCCEEDED" : "FAILED",
        {
          paidAt: paymentIntent.status === "succeeded" ? new Date() : undefined,
          failureReason:
            paymentIntent.status === "failed" ? "Payment failed" : undefined,
        }
      );
    }

    revalidatePath("/dashboard/invoices");
    return { success: true, status: paymentIntent.status };
  } catch (error) {
    console.error("Payment confirmation failed:", error);
    return { success: false, error: "Failed to confirm payment" };
  }
}
