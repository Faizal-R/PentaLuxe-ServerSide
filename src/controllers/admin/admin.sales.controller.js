import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { adminSalesService } from "../../services/admin/admin.sales.service.js";

const generateSalesReport = asyncHandler(async (req, res) => {
  const { dateRange, startDate, endDate } = req.body;
  const result = await adminSalesService.generateSalesReport({ dateRange, startDate, endDate });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { generateSalesReport };
