import { NextRequest, NextResponse } from "next/server";
import {
  generatePaymentConfirmedEmail,
  generatePaymentConfirmedEmailText,
} from "@/lib/email/templates/payment-confirmed";

interface PaymentConfirmedRequest {
  roommateEmail: string;
  roommateeName: string;
  escrowId: string;
  amount: string;
  txHash: string;
  date: string;
  dashboardUrl: string;
}

/**
 * POST /api/notifications/payment-confirmed
 *
 * Sends a payment confirmation email to the roommate after a successful contribution.
 * In development, logs email content to console.
 */
export async function POST(request: NextRequest) {
  try {
    const body: PaymentConfirmedRequest = await request.json();

    // Validate required fields
    const required = [
      "roommateEmail",
      "roommateeName",
      "escrowId",
      "amount",
      "txHash",
      "date",
      "dashboardUrl",
    ];
    const missing = required.filter((field) => !body[field as keyof PaymentConfirmedRequest]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.roommateEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Generate email content
    const htmlContent = generatePaymentConfirmedEmail(body);
    const textContent = generatePaymentConfirmedEmailText(body);

    // Log email content in development
    if (process.env.NODE_ENV === "development") {
      console.log("\n========== PAYMENT CONFIRMATION EMAIL ==========");
      console.log(`TO: ${body.roommateEmail}`);
      console.log(`SUBJECT: Payment Confirmed - ${body.escrowId}`);
      console.log("------- HTML CONTENT -------");
      console.log(htmlContent);
      console.log("------- TEXT CONTENT -------");
      console.log(textContent);
      console.log("===============================================\n");
    }

    // Attempt to send email if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    if (resendApiKey && resendFromEmail) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: body.roommateEmail,
            subject: `Payment Confirmed - ${body.escrowId}`,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Resend API error:", errorData);
          // Don't fail the entire request if email service is down
          // Still return success so the contribution is confirmed
          return NextResponse.json(
            {
              success: true,
              message: "Payment confirmed. Email delivery may be delayed.",
              emailDeliveryNote: "Service temporarily unavailable",
            },
            { status: 200 }
          );
        }

        const emailResponse = await response.json();
        console.log("Email sent successfully:", emailResponse);

        return NextResponse.json(
          {
            success: true,
            message: "Payment confirmation email sent",
            emailId: emailResponse.id,
          },
          { status: 200 }
        );
      } catch (emailError) {
        console.error("Failed to send email via Resend:", emailError);
        // Return success anyway - payment is confirmed, just email delivery failed
        return NextResponse.json(
          {
            success: true,
            message: "Payment confirmed. Email delivery failed.",
            emailDeliveryNote: "Service error - email not sent",
          },
          { status: 200 }
        );
      }
    } else {
      // Email service not configured - success in dev, but warn in production
      if (process.env.NODE_ENV === "production") {
        console.warn("Warning: Email service not configured (RESEND_API_KEY or RESEND_FROM_EMAIL missing)");
      }

      return NextResponse.json(
        {
          success: true,
          message: "Payment confirmed. Email service not configured.",
          emailDeliveryNote: "Development mode - check console for email content",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error processing payment confirmation:", error);
    return NextResponse.json(
      { error: "Failed to process payment confirmation" },
      { status: 500 }
    );
  }
}
