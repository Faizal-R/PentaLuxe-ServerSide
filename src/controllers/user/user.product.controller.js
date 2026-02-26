import { asyncHandler } from "../../helpers/asyncHandler.js";
import { createResponse } from "../../helpers/responseHandler.js";
import { productService } from "../../services/user/user.product.service.js";

const productDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await productService.productDetails(id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const searchProductsByCategory = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const result = await productService.searchProductsByCategory(text);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const { categoryName, productID } = req.query;
  const result = await productService.getRelatedProducts({ categoryName, productID });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export {
  productDetails,
  getProducts,
  searchProductsByCategory,
  getRelatedProducts,
};
