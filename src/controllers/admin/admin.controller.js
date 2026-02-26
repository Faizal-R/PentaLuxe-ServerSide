import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { adminService } from "../../services/admin/admin.service.js";

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminService.adminLogin({ email, password });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const uploadFilesAndAddCategory = asyncHandler(async (req, res) => {
  const { categoryName } = req.body;
  const result = await adminService.uploadFilesAndAddCategory(req.file, categoryName);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const getCategories = asyncHandler(async (req, res) => {
  const result = await adminService.getCategories();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminService.deleteCategory(id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const EditCategory = asyncHandler(async (req, res) => {
  const { categoryName, categoryId } = req.body;
  const result = await adminService.editCategory(req.file, { categoryName, categoryId });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export {
  adminLogin,
  uploadFilesAndAddCategory,
  getCategories,
  deleteCategory,
  EditCategory,
};
