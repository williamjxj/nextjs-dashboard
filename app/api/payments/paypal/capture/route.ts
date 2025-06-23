import { PaymentService } from "@/app/lib/payment-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("Received request to capture PayPal payment");
  try {
    const { orderId } = await req.json();
    console.log("Processing capture for orderId:", orderId);

    if (!orderId) {
      console.error("Order ID is missing in the request");
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    console.log(`Attempting to capture PayPal order: ${orderId}`);
    const capturedOrder = await PaymentService.capturePayPalOrder(orderId);
    console.log(
      "Successfully captured order. PayPal response:",
      JSON.stringify(capturedOrder, null, 2)
    );

    // Find the payment record by PayPal order ID
    console.log(`Searching for payment with paypalOrderId: ${orderId}`);
    const payments = await PaymentService.getPaymentsByInvoice("");
    const payment = payments.find((p) => p.paypalOrderId === orderId);

    if (payment) {
      console.log(`Found payment record with ID: ${payment.id}`);
      const status =
        capturedOrder.status === "COMPLETED" ? "SUCCEEDED" : "FAILED";
      console.log(`Updating payment status to: ${status}`);

      await PaymentService.updatePaymentStatus(payment.id, status, {
        paypalCaptureId: capturedOrder.id,
        paidAt: status === "SUCCEEDED" ? new Date() : undefined,
        failureReason:
          status === "FAILED" ? "PayPal capture failed" : undefined,
      });
      console.log("Payment status updated successfully.");
    } else {
      console.warn(`No payment record found for paypalOrderId: ${orderId}`);
    }

    return NextResponse.json({
      success: true,
      order: capturedOrder,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to capture PayPal payment", details: errorMessage },
      { status: 500 }
    );
  }
}
