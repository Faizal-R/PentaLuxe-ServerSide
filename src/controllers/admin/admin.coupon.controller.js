import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { couponService } from "../../services/admin/admin.coupon.service.js";

const createCoupon = asyncHandler(async (req, res) => {
  const { couponData } = req.body;
  const result = await couponService.createCoupon(couponData);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const editCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { couponData } = req.body;
  const result = await couponService.editCoupon(id, couponData);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await couponService.deleteCoupon(id);
  return createResponse(res, result.statusCode, result.success, result.message);
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const result = await couponService.getAllCoupons();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { createCoupon, deleteCoupon, editCoupon, getAllCoupons };
