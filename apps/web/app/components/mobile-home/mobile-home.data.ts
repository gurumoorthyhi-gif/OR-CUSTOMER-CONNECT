import type { MobileDashboardData } from "./mobile-home.types";

export const mobileDashboardSample: MobileDashboardData = {
  customerName: "GURU",
  unreadCount: 3,
  stats: [
    { label: "Active Orders", value: "3", tone: "purple" },
    { label: "Need Approval", value: "2", tone: "amber" },
    { label: "Payment Due", value: "4", tone: "rose" },
    { label: "Dispatched", value: "2", tone: "green" },
  ],
  activeOrder: {
    id: "OR-1058",
    title: "DTF Transfers",
    designs: "16 Designs",
    quantity: "100 pcs",
    date: "12 Sep 2026",
    status: "Printing",
    progress: 40,
    stage: "Printing",
    previewSrc: "/artwork/active-order-preview.svg",
  },
  level: {
    current: 3,
    label: "Dealer Rate",
    currentMeters: 721,
    targetMeters: 1000,
  },
};
