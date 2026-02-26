import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { adminProductService } from "../../services/admin/admin.product.service.js";

const uploadFilesAndAddProducts = asyncHandler(async (req, res) => {
  const result = await adminProductService.uploadFilesAndAddProducts(req.files, req.body);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const getAllProducts = asyncHandler(async (req, res) => {
  const result = await adminProductService.getAllProducts();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminProductService.deleteProduct(id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const singleProudct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminProductService.singleProduct(id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminProductService.updateProduct(id, req.file, req.body);
  return createResponse(res, result.statusCode, result.success, result.message);
});

const searchProducts = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const result = await adminProductService.searchProducts(text);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export {
  uploadFilesAndAddProducts,
  getAllProducts,
  deleteProduct,
  singleProudct,
  updateProduct,
  searchProducts,
};
