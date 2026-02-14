import Product from "../../models/product.model.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import Category from "../../models/category.model.js";
import { searchProducts } from "../admin/admin.product.controller.js";
import { statusCodes } from "../../constants.js";

const productDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id)
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "Product ID is required"
    );

  const product = await Product.findById(id)
    .populate("Variants")
    .populate("CategoryId");

  if (!product)
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "No product exists for the provided ID"
    );

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "Product details fetched successfully",
    product
  );
});

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("Variants")
      .populate("CategoryId")
      .sort({ createdAt: -1 });

    const filterdProductsByCategory = products.filter(
      (product) => product.CategoryId !== null
    );

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Products fetched successfully based on user preference.",
      filterdProductsByCategory
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Error fetching products."
    );
  }
};

const searchProductsByCategory = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "No Text provided"
    );
  }

  try {
    const products = await Product.find({})
      .populate("CategoryId")
      .populate("Variants");

    const regex = new RegExp(text, "i");

    const searchedProducts = products.filter((product) =>
      product.CategoryId.categoryName.match(regex)
    );

    if (!searchedProducts || searchedProducts.length === 0) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "No products found."
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Products found.",
      searchedProducts
    );
  } catch (error) {
    console.error(error);
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Server error. Please try again later."
    );
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const { categoryName, productID } = req.body;

    const category = await Category.findOne({ categoryName });

    if (!category) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Category Not Found"
      );
    }

    const relatedProducts = await Product.find({
      CategoryId: category._id,
    })
      .populate("Variants")
      .populate("CategoryId")
      .limit(3);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "related product fetched Successfully",
      relatedProducts
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
};

export {
  productDetails,
  getProducts,
  searchProductsByCategory,
  getRelatedProducts,
};
