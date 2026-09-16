import type { MobileOrdersData } from "./mobile-orders.types";

export const mobileOrdersSample: MobileOrdersData = {
  activeFilter: "Active",
  searchPlaceholder: "Search orders, designs or products...",
  filters: ["Active", "Completed", "All"],
  orders: [
    {
      id: "OR-1028",
      date: "12 Sep 2026",
      designs: "12 designs",
      quantity: "15 m",
      status: "Printing",
      progress: 63,
      thumbs: [
        { src: "/artwork/order-thumb-raven-shirt.svg", alt: "Raven shirt" },
        { src: "/artwork/order-thumb-logo.svg", alt: "Logo artwork" },
        { src: "/artwork/order-thumb-burst.svg", alt: "Burst artwork" },
      ],
      extraCount: "+9",
      actionLabel: "View",
      actionHref: "/orders/OR-1028",
      metrics: [
        { label: "Amount", value: "₹12,450", icon: "amount" },
        { label: "Payment", value: "Paid", icon: "payment" },
        { label: "ETA", value: "15 Sep 2026", icon: "time" },
      ],
    },
    {
      id: "OR-1025",
      date: "10 Sep 2026",
      designs: "8 designs",
      quantity: "10 m",
      status: "Approval",
      helperTitle: "Waiting for your approval",
      helperText: "Review and confirm your designs to continue.",
      thumbs: [
        { src: "/artwork/order-thumb-good-things.svg", alt: "Good things art" },
        { src: "/artwork/order-thumb-flower.svg", alt: "Flower artwork" },
        { src: "/artwork/order-thumb-raven-white.svg", alt: "White shirt" },
      ],
      extraCount: "+5",
      actionLabel: "Review",
      actionHref: "/orders/OR-1025",
      metrics: [
        { label: "Amount", value: "₹8,200", icon: "amount" },
        { label: "Payment", value: "Pending", icon: "payment" },
        { label: "Required By", value: "12 Sep 2026", icon: "time" },
      ],
    },
    {
      id: "OR-1019",
      date: "08 Sep 2026",
      designs: "20 designs",
      quantity: "25 m",
      status: "Dispatched",
      helperTitle: "In transit",
      helperText: "Your order is on the way.",
      thumbs: [
        { src: "/artwork/order-thumb-hoodie.svg", alt: "Hoodie" },
        { src: "/artwork/order-thumb-logo.svg", alt: "Logo artwork" },
        { src: "/artwork/order-thumb-raven-wing.svg", alt: "Wing artwork" },
      ],
      extraCount: "+17",
      actionLabel: "Track",
      actionHref: "/track?orderId=OR-1019",
      metrics: [
        { label: "Courier", value: "Delhivery", icon: "courier" },
        { label: "AWB No.", value: "DLY12345678", icon: "awb" },
        { label: "Estimated Delivery", value: "11 Sep 2026", icon: "time" },
      ],
    },
  ],
};
