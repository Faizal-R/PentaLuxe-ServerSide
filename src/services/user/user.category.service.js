import Product from "../../models/product.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const getAllProductsByCategory = async (id) => {
  const products = await Product.find({ CategoryId: id })
    .populate("Variants");

  if (!products || products.length === 0) {
    throw new CustomError(messages.PRODUCT.SEARCH_EMPTY, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PRODUCT.FETCH_SUCCESS,
    data: products,
  };
};

export const categoryService = {
  getAllProductsByCategory,
};
