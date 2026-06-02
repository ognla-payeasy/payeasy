/**
 * Email template for payment confirmation
 */

export interface PaymentConfirmedData {
  roommateEmail: string;
  roommateeName: string;
  escrowId: string;
  amount: string;
  txHash: string;
  date: string;
  dashboardUrl: string;
}

/**
 * Generate HTML content for payment confirmation email
 */
export function generatePaymentConfirmedEmail(data: PaymentConfirmedData): string {
  const {
    roommateEmail,
    roommateeName,
    escrowId,
    amount,
    txHash,
    date,
    dashboardUrl,
  } = data;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #5c7cfa 0%, #748ffc 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .payment-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #5c7cfa; }
      .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
      .detail-row:last-child { border-bottom: none; }
      .detail-label { font-weight: 600; color: #666; }
      .detail-value { color: #333; font-family: 'Courier New', monospace; word-break: break-all; }
      .amount { font-size: 24px; font-weight: bold; color: #5c7cfa; }
      .button { display: inline-block; background: #5c7cfa; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
      .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
      .txhash { font-size: 12px; word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Payment Confirmed ✓</h1>
        <p>Your rent contribution has been successfully recorded on the Stellar blockchain</p>
      </div>
      
      <div class="content">
        <p>Hi <strong>${roommateeName}</strong>,</p>
        
        <p>We're writing to confirm that your payment for the escrow agreement has been successfully processed. Your contribution is now secured on the blockchain.</p>
        
        <div class="payment-details">
          <div class="detail-row">
            <span class="detail-label">Amount</span>
            <span class="detail-value amount">${amount} XLM</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Escrow ID</span>
            <span class="detail-value">${escrowId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction Hash</span>
            <span class="detail-value txhash">${txHash}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date & Time</span>
            <span class="detail-value">${new Date(date).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "UTC",
            })} UTC</span>
          </div>
        </div>
        
        <p>This transaction can be verified on the Stellar blockchain using the transaction hash provided above.</p>
        
        <p style="text-align: center;">
          <a href="${dashboardUrl}" class="button">View Dashboard</a>
        </p>
        
        <p style="margin-top: 30px; font-size: 13px; color: #666;">
          If you have any questions about this payment or need further assistance, please visit your dashboard or contact your landlord.
        </p>
      </div>
      
      <div class="footer">
        <p>This is an automated email from PayEasy. Please do not reply to this email.</p>
        <p>&copy; 2025 PayEasy. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email
 */
export function generatePaymentConfirmedEmailText(data: PaymentConfirmedData): string {
  const {
    roommateeName,
    escrowId,
    amount,
    txHash,
    date,
    dashboardUrl,
  } = data;

  return `
Payment Confirmed ✓
Your rent contribution has been successfully recorded on the Stellar blockchain

Hi ${roommateeName},

We're writing to confirm that your payment for the escrow agreement has been successfully processed. Your contribution is now secured on the blockchain.

PAYMENT DETAILS
Amount: ${amount} XLM
Escrow ID: ${escrowId}
Transaction Hash: ${txHash}
Date & Time: ${new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  })} UTC

This transaction can be verified on the Stellar blockchain using the transaction hash provided above.

View your dashboard: ${dashboardUrl}

If you have any questions about this payment or need further assistance, please visit your dashboard or contact your landlord.

---
This is an automated email from PayEasy. Please do not reply to this email.
© 2025 PayEasy. All rights reserved.
  `.trim();
}
