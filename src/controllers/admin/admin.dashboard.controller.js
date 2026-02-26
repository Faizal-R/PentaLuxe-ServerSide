import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { adminDashboardService } from "../../services/admin/admin.dashboard.service.js";

const getAdminDashboard = asyncHandler(async (req, res) => {
  const { filter } = req.query;
  const result = await adminDashboardService.getAdminDashboard({ filter });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const bestSellingProducts = asyncHandler(async (req, res) => {
  const result = await adminDashboardService.bestSellingProducts();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const bestSellingCategories = asyncHandler(async (req, res) => {
  const result = await adminDashboardService.bestSellingCategories();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { getAdminDashboard, bestSellingProducts, bestSellingCategories };
