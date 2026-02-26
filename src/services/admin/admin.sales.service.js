import Order from "../../models/order.model.js";
import { calculateDateRange } from "../../utils/CalculateDateRange.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";

const generateSalesReport = async ({ dateRange, startDate, endDate }) => {
  if (dateRange === "full-report") {
    const salesReport = await Order.find({
      status: { $in: ["Confirmed", "Delivered", "Shipped"] },
    }).populate("user");

    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.ADMIN.SALES_REPORT_GENERATED,
      data: salesReport,
    };
  }

  const { start, end } = calculateDateRange(dateRange, startDate, endDate);

  const salesReport = await Order.find({
    $and: [
      { status: { $in: ["Confirmed", "Delivered", "Shipped"] } },
      { orderDate: { $gte: start, $lte: end } },
    ],
  }).populate("user");

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.SALES_REPORT_GENERATED,
    data: salesReport,
  };
};

export const adminSalesService = {
  generateSalesReport,
};
