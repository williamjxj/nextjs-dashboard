"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

// Mock validation schemas
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

// Mock Stripe Payment Intent Creation
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

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock payment intent
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
    };

    console.log(`✅ Mock Stripe payment created: ${mockPaymentIntent.id}`);
    console.log(`💰 Amount: $${amount} ${currency.toUpperCase()}`);
    console.log(`📧 User: ${session.user.email}`);

    return {
      success: true,
      message: "Mock payment intent created successfully",
      paymentIntent: mockPaymentIntent,
    };
  } catch (error) {
    console.error("Mock Stripe payment creation failed:", error);
    return {
      message: "Failed to create payment. Please try again.",
    };
  }
}

// Mock PayPal Order Creation
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

    // Simulate PayPal processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock PayPal order
    const mockPayPalOrder = {
      id: `PAYPAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "CREATED",
    };

    console.log(`✅ Mock PayPal order created: ${mockPayPalOrder.id}`);
    console.log(`💰 Amount: $${amount} ${currency.toUpperCase()}`);
    console.log(`📧 User: ${session.user.email}`);

    return {
      success: true,
      message: "Mock PayPal order created successfully",
      paypalOrder: mockPayPalOrder,
    };
  } catch (error) {
    console.error("Mock PayPal payment creation failed:", error);
    return {
      message: "Failed to create PayPal payment. Please try again.",
    };
  }
}

// Mock Payment Confirmation
export async function confirmMockPayment(paymentIntentId: string) {
  try {
    console.log(`✅ Mock payment confirmed: ${paymentIntentId}`);
    
    // Simulate random success/failure for testing
    const isSuccess = Math.random() > 0.1; // 90% success rate
    
    if (isSuccess) {
      console.log('✅ Mock payment succeeded!');
      revalidatePath("/dashboard/invoices");
      return { success: true, status: "succeeded" };
    } else {
      console.log('❌ Mock payment failed!');
      return { success: false, status: "failed", error: "Mock payment failure for testing" };
    }
  } catch (error) {
    console.error("Mock payment confirmation failed:", error);
    return { success: false, error: "Failed to confirm payment" };
  }
}
