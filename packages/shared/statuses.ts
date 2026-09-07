export const customerOrderStatuses = [
  "received",
  "artwork_checking",
  "awaiting_approval",
  "awaiting_payment",
  "payment_confirmed",
  "in_queue",
  "printing",
  "qc",
  "packed",
  "dispatched",
  "delivered",
  "completed",
] as const;

export const paymentStatuses = [
  "pending",
  "partial",
  "paid",
  "credit_approved",
  "failed",
  "refunded",
  "partial_refund",
] as const;

