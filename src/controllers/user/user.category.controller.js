import Product from "../../models/product.model.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { createResponse } from "../../helpers/responseHandler.js";
import { statusCodes } from "../../constant/statusCodes.js";

const getAllProductsByCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const products = await Product.find({ CategoryId: id })
    .populate("Variants");

  if (!products || products.length === 0) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "No Products found in this category"
    );
  }

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "All Products are fetched based on the Category",
    products
  );
});

export { getAllProductsByCategory };
