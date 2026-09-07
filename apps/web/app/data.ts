export const sampleOrders = [
  {
    id: "OR-1028",
    title: "Streetwear chest logos",
    status: "Awaiting approval",
    meters: "8.4 m",
    amount: "Rs. 3,780",
    eta: "Today, 7:30 PM",
    rate: "Rs. 450 / m",
    payment: "Estimate ready",
    timeline: ["Received", "Artwork checked", "Preview ready", "Approval pending"],
  },
  {
    id: "OR-1025",
    title: "Kids wear combo sheet",
    status: "Printing",
    meters: "14.2 m",
    amount: "Rs. 6,248",
    eta: "Tomorrow",
    rate: "Rs. 440 / m",
    payment: "Paid",
    timeline: ["Received", "Approved", "Payment confirmed", "Printing"],
  },
  {
    id: "OR-1019",
    title: "College hoodie names",
    status: "Dispatched",
    meters: "5.8 m",
    amount: "Rs. 2,610",
    eta: "Tracking active",
    rate: "Rs. 450 / m",
    payment: "Paid",
    timeline: ["Received", "Printed", "Packed", "Dispatched"],
  },
];

export const sampleCustomer = {
  id: "OR-TN-0001",
  name: "Sowmiya Prints",
  mobile: "+91 98765 43210",
  gst: "33ABCDE1234F1Z5",
  level: "Dealer",
  manager: "ODD RAVEN Support",
  address: "Coimbatore, Tamil Nadu",
};

export const sampleDesigns = [
  { name: "Raven back print", size: "12 x 15 in", used: "Last used in OR-1028" },
  { name: "Logo pack V3", size: "Mixed", used: "Ready for reorder" },
  { name: "Kids badges", size: "4 x 4 in", used: "Last used in OR-1025" },
  { name: "Name sheet", size: "2.5 x 9 in", used: "Archived" },
];

export const sampleMessages = [
  { from: "Staff", text: "Artwork looks clear for print.", time: "10:42 AM" },
  { from: "You", text: "Please confirm the black background is removed.", time: "10:38 AM" },
  { from: "Staff", text: "Preview uploaded for approval.", time: "10:20 AM" },
];

export const samplePayments = [
  { id: "PAY-8102", orderId: "OR-1028", status: "Awaiting payment", amount: "Rs. 3,780" },
  { id: "PAY-8098", orderId: "OR-1025", status: "Paid", amount: "Rs. 6,248" },
  { id: "PAY-8089", orderId: "OR-1019", status: "Paid", amount: "Rs. 2,610" },
];

export const sampleSupportTickets = [
  { id: "SUP-210", orderId: "OR-1019", status: "Open", issue: "Courier tracking update" },
  { id: "SUP-204", orderId: "OR-1014", status: "Closed", issue: "Reprint clarification" },
];

export const sampleAuditEvents = [
  "OTP login verified",
  "OR-1028 preview opened",
  "ERP rate snapshot received",
  "Approval action pending",
];

export const sampleProductionJobs = [
  {
    id: "JOB-501",
    orderId: "OR-1025",
    machine: "Four Head 01",
    operator: "Operator A",
    status: "Printing",
    meters: "14.2 m",
    waste: "0.3 m",
  },
  {
    id: "JOB-502",
    orderId: "OR-1028",
    machine: "Awaiting assignment",
    operator: "Pending",
    status: "Queue",
    meters: "8.4 m",
    waste: "0 m",
  },
];

export const sampleMachines = [
  { name: "Four Head 01", status: "Running", queue: "2 jobs", speed: "18 m/hr" },
  { name: "Six Head 01", status: "Available", queue: "0 jobs", speed: "32 m/hr" },
  { name: "Supplier Route", status: "Manual", queue: "1 job", speed: "External" },
];

export const sampleQcItems = [
  { id: "QC-7001", orderId: "OR-1025", status: "Pending", defect: "None reported" },
  { id: "QC-6998", orderId: "OR-1019", status: "Passed", defect: "None" },
];

export const sampleShipments = [
  { id: "SHP-3301", orderId: "OR-1019", courier: "Manual courier", awb: "Pending API", status: "Dispatched" },
  { id: "SHP-3302", orderId: "OR-1025", courier: "Local pickup", awb: "Not needed", status: "Packing pending" },
];

export const sampleInvoices = [
  { id: "INV-2401", orderId: "OR-1025", status: "Generated", amount: "Rs. 6,248" },
  { id: "PRO-2402", orderId: "OR-1028", status: "Proforma", amount: "Rs. 3,780" },
];

export const sampleSuppliers = [
  { name: "Partner Printer A", jobs: "1 active", cost: "Rs. 390 / m", status: "Available" },
  { name: "Partner Printer B", jobs: "0 active", cost: "Rs. 410 / m", status: "Backup" },
];
