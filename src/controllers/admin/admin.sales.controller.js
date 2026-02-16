import { statusCodes } from "../../constant/statusCodes.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import Order from "../../models/order.model.js";

import { calculateDateRange } from "../../utils/CalculateDateRange.js";

const generateSalesReport = async (req, res) => {
  console.log("inside generate Sales Report");
  const { dateRange, startDate, endDate } = req.body;
  console.log(req.body);
  try {
    if (dateRange === "full-report") {
      const salesReport = await Order.find({
        status: { $in: ["Confirmed", "Delivered", "Shipped"] },
      }).populate("user");
      return createResponse(
        res,
       statusCodes.OK,
        true,
        "Sales Generatored Successfully",
        salesReport
      );
    }
    const { start, end } = calculateDateRange(dateRange, startDate, endDate);

    const salesReport = await Order.find({
      $and: [
        { status: { $in: ["Confirmed", "Delivered", "Shipped"] } },
        { orderDate: { $gte: start, $lte: end } },
      ],
    }).populate("user");

    console.log("salesReport", salesReport);
    createResponse(
      res,
     statusCodes.OK,
      true,
      "Sales Generatored Successfully",
      salesReport
    );
  } catch (error) {
    serverErrorResponse(res);
  }
};




export { generateSalesReport };
