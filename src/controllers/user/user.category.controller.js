import { asyncHandler } from "../../helpers/asyncHandler.js";
import { createResponse } from "../../helpers/responseHandler.js";
import { categoryService } from "../../services/user/user.category.service.js";

const getAllProductsByCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await categoryService.getAllProductsByCategory(id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { getAllProductsByCategory };
