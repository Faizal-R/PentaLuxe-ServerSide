import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const productDetails = async (id) => {
  if (!id) {
    throw new CustomError(messages.PRODUCT.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const product = await Product.findById(id)
    .populate("Variants")
    .populate("CategoryId");

  if (!product) {
    throw new CustomError(messages.PRODUCT.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PRODUCT.RETRIEVED,
    data: product,
  };
};

const getProducts = async () => {
  const products = await Product.find()
    .populate("Variants")
    .populate("CategoryId")
    .sort({ createdAt: -1 });

  const filterdProductsByCategory = products.filter(
    (product) => product.CategoryId !== null
  );

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PRODUCT.FETCH_SUCCESS,
    data: filterdProductsByCategory,
  };
};

const searchProductsByCategory = async (text) => {
  if (!text) {
    throw new CustomError(messages.COMMON.BAD_REQUEST, statusCodes.BAD_REQUEST);
  }

  const products = await Product.find({})
    .populate("CategoryId")
    .populate("Variants");

  const regex = new RegExp(text, "i");

  const searchedProducts = products.filter((product) =>
    product.CategoryId && product.CategoryId.categoryName.match(regex)
  );

  if (!searchedProducts || searchedProducts.length === 0) {
    throw new CustomError(messages.PRODUCT.SEARCH_EMPTY, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PRODUCT.SEARCH_SUCCESS,
    data: searchedProducts,
  };
};

const getRelatedProducts = async ({ categoryName, productID }) => {
  const category = await Category.findOne({ categoryName });

  if (!category) {
    throw new CustomError(messages.ADMIN.CATEGORY_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  const relatedProducts = await Product.find({
    CategoryId: category._id,
    _id: { $ne: productID }
  })
    .populate("Variants")
    .populate("CategoryId");

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PRODUCT.RELATED_SUCCESS,
    data: relatedProducts,
  };
};

export const productService = {
  productDetails,
  getProducts,
  searchProductsByCategory,
  getRelatedProducts,
};
