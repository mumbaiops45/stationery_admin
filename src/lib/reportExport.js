import { formatDateTime } from "@/lib/format";
import { addSheet, downloadWorkbook, loadExcelJS, todayStamp } from "@/lib/excel";

const MONEY_FORMAT = "#,##0";

/**
 * Builds a multi-sheet .xlsx from a normalized report (see
 * services/report.service.js's `normalizeReport`) and triggers a browser
 * download. Every row the report holds goes in — not just what the page
 * happens to have rendered (the daily table, for one, is collapsed by
 * default) — since the point of an export is to have the full period on
 * hand outside the dashboard.
 */
export async function exportReportToExcel(report, { periodLabel } = {}) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ChoiceKraft Admin";
  workbook.created = new Date();

  const totalOrders = report.summary.totalOrders;
  const deliveredRate = totalOrders
    ? Math.round((report.summary.deliveredOrders / totalOrders) * 100)
    : 0;
  const cancelledRate = totalOrders
    ? Math.round((report.summary.cancelledOrders / totalOrders) * 100)
    : 0;

  addSheet(workbook, {
    name: "Summary",
    columns: [
      { header: "Metric", key: "metric", width: 26 },
      { header: "Value", key: "value", width: 24, align: "right" },
    ],
    rows: [
      { metric: "Period", value: periodLabel || report.period.type },
      {
        metric: "From",
        value: report.period.from ? formatDateTime(report.period.from) : "—",
      },
      { metric: "To", value: report.period.to ? formatDateTime(report.period.to) : "—" },
      { metric: "" },
      { metric: "Total revenue (₹)", value: report.revenue.total },
      { metric: "Goods subtotal (₹)", value: report.revenue.subtotal },
      { metric: "Shipping (₹)", value: report.revenue.shipping },
      { metric: "" },
      { metric: "Total orders", value: totalOrders },
      { metric: "Delivered orders", value: report.summary.deliveredOrders },
      { metric: "Delivered rate (%)", value: deliveredRate },
      { metric: "Cancelled orders", value: report.summary.cancelledOrders },
      { metric: "Cancelled rate (%)", value: cancelledRate },
      { metric: "" },
      { metric: "Total customers", value: report.summary.totalCustomers },
      { metric: "Total products", value: report.summary.totalProducts },
      { metric: "Total categories", value: report.summary.totalCategories },
    ],
  });

  addSheet(workbook, {
    name: "Daily sales",
    columns: [
      { header: "Date", key: "date", width: 14 },
      { header: "Orders", key: "orders", width: 12, align: "right" },
      { header: "Revenue (₹)", key: "revenue", width: 16, numFmt: MONEY_FORMAT, align: "right" },
    ],
    rows: report.dailySales,
  });

  addSheet(workbook, {
    name: "Top products",
    columns: [
      { header: "Rank", key: "rank", width: 8 },
      { header: "Product", key: "name", width: 36 },
      { header: "Units sold", key: "quantity", width: 14, align: "right" },
      { header: "Revenue (₹)", key: "revenue", width: 16, numFmt: MONEY_FORMAT, align: "right" },
    ],
    rows: report.topProducts.map((product, index) => ({
      rank: index + 1,
      name: product.name,
      quantity: product.quantity,
      revenue: product.revenue,
    })),
  });

  addSheet(workbook, {
    name: "Payments",
    columns: [
      { header: "Status", key: "label", width: 16 },
      { header: "Count", key: "count", width: 12, align: "right" },
      { header: "Amount (₹)", key: "amount", width: 16, numFmt: MONEY_FORMAT, align: "right" },
    ],
    rows: report.payments,
  });

  await downloadWorkbook(workbook, `sales-report-${report.period.type}-${todayStamp()}.xlsx`);
}
