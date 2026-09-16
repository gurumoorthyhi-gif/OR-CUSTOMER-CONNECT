export type OrderCardStatus = "Printing" | "Approval" | "Dispatched" | "Completed";

export type OrderCardMetric = {
  label: string;
  value: string;
  icon: "amount" | "payment" | "time" | "courier" | "awb";
};

export type OrderCardThumb = {
  src: string;
  alt: string;
};

export type MobileOrderCard = {
  id: string;
  date: string;
  designs: string;
  quantity: string;
  status: OrderCardStatus;
  progress?: number;
  helperTitle?: string;
  helperText?: string;
  thumbs: OrderCardThumb[];
  extraCount?: string;
  actionLabel: string;
  actionHref: string;
  metrics: OrderCardMetric[];
};

export type MobileOrdersData = {
  activeFilter: "Active" | "Completed" | "All";
  searchPlaceholder: string;
  filters: Array<"Active" | "Completed" | "All">;
  orders: MobileOrderCard[];
};
