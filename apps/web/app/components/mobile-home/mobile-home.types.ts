export type MobileDashboardStat = {
  label: string;
  value: string;
  tone: "purple" | "amber" | "rose" | "green";
};

export type MobileDashboardOrder = {
  id: string;
  title: string;
  designs: string;
  quantity: string;
  date: string;
  status: string;
  progress: number;
  stage: "Artwork" | "Printing" | "Quality Check" | "Packing" | "Shipped";
  previewSrc?: string;
};

export type MobileDashboardData = {
  customerName: string;
  unreadCount: number;
  stats: MobileDashboardStat[];
  activeOrder: MobileDashboardOrder;
  level: {
    current: number;
    label: string;
    currentMeters: number;
    targetMeters: number;
  };
};
