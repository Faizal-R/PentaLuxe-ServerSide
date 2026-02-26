import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { adminUserService } from "../../services/admin/admin.user.service.js";

const getAllUser = asyncHandler(async (req, res) => {
  const result = await adminUserService.getAllUser();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { id, status } = req.body;
  const result = await adminUserService.updateUserStatus({ id, status });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const searchUsers = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const result = await adminUserService.searchUsers(text);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export {
  getAllUser,
  updateUserStatus,
  searchUsers,
};
