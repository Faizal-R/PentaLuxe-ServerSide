import { asyncHandler } from "../../helpers/asyncHandler.js";
import { uploadOnCloudinary } from "../../helpers/cloudinary.js";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import qs from "qs";
import { Variant } from "../../models/variant.model.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import { statusCodes } from "../../constant/statusCodes.js";

const uploadFilesAndAddProducts = asyncHandler(async (req, res) => {
  try {
    console.log("Received request to upload files and add product");

    const parsedBody = qs.parse(req.body);
    const {
      Name,
      categoryName,
      ScentType,
      Description,
      Gender,
      DiscountPercentage,
      productVolumes,
    } = parsedBody;

    if (!req.files || req.files.length === 0) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "No files uploaded"
      );
    }

    const response = await uploadOnCloudinary(req.files);

    if (!response || response.length === 0) {
      return serverErrorResponse(res, "File upload failed");
    }

    const category = await Category.findOne({ categoryName });

    if (!category) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Category Not Found"
      );
    }

    const product = await Product.create({
      Name,
      Description,
      Gender,
      isBlocked: false,
      ScentType,
      Images: response,
      DiscountPercentage,
      CategoryId: category._id,
    });

    const productVolumesArray = Object.entries(productVolumes).map(
      ([key, value]) => ({
        productId: product._id,
        volume: key,
        price: Number(value.price),
        stock: Number(value.stock),
      })
    );

    const createdVariants = await Variant.create(productVolumesArray);

    await Product.updateOne(
      { _id: product._id },
      { $set: { Variants: createdVariants.map((v) => v._id) } }
    );

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "Product added successfully",
      product
    );
  } catch (error) {
    console.error("Error adding product:", error);
    return serverErrorResponse(res);
  }
});

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("CategoryId")
      .populate("Variants")
      .sort({ createdAt: -1 });

    const filteredProducts = products.filter(
      (product) => product.CategoryId !== null
    );

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Products fetched successfully",
      filteredProducts
    );
  } catch (err) {
    console.error(err);
    return serverErrorResponse(res, "Failed to fetch products");
  }
};

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("adminId", id);

  if (!id) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "Product ID is required"
    );
  }

  const deletedProduct = await Product.findByIdAndDelete(id);

  if (!deletedProduct) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "Product not found"
    );
  }

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "Product deleted successfully",
    deletedProduct
  );
});

const singleProudct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "Product ID is Not provided"
    );
  }

  const product = await Product.findById({ _id: id })
    .populate("CategoryId")
    .populate("Variants");

  if (!product) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "No Product is Founded With Provided Id"
    );
  }

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "Product fetched Successfully",
    product
  );
});

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      Name,
      Gender,
      categoryName,
      DiscountPercentage,
      Description,
      ScentType,
    } = req.body;

    const Quantities = JSON.parse(req.body.Quantities);
    const existingImages = JSON.parse(req.body.existingImages);

    console.log(req.file);

    if (req.file) {
      const response = await uploadOnCloudinary(req.file);

      if (!response || response.length === 0) {
        return serverErrorResponse(res, "File upload failed");
      }

      existingImages.push(response[0]);
    }

    const category = await Category.findOne({ categoryName });

    const product = await Product.findById(id).populate("Variants");

    if (!product) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Product not found"
      );
    }

    const updatePromises = [];

    for (const quantity of Quantities) {
      if (quantity._id) {
        updatePromises.push(
          Variant.findByIdAndUpdate(
            quantity._id,
            {
              volume: quantity.volume,
              price: quantity.price,
              stock: quantity.stock,
            },
            { new: true }
          )
        );
      } else {
        updatePromises.push(
          Variant.create({
            productId: id,
            volume: quantity.volume,
            price: quantity.price,
            stock: quantity.stock,
          })
        );
      }
    }

    const updatedVariants = await Promise.all(updatePromises);

    product.Name = Name;
    product.Gender = Gender;
    product.CategoryId = category._id;
    product.DiscountPercentage = DiscountPercentage;
    product.Description = Description;
    product.ScentType = ScentType;
    product.Images = existingImages;
    product.Variants = updatedVariants.map((v) => v._id);

    await product.save();

    console.log("updatedProduct", product);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Product Updated Successfully"
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return serverErrorResponse(res);
  }
};

const searchProducts = async (req, res) => {
  const { text } = req.body;
  console.log(text);

  if (!text) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "No text provided."
    );
  }

  try {
    const products = await Product.find({
      Name: new RegExp(text, "i"),
    }).populate("CategoryId");

    console.log(products);

    if (!products || products.length === 0) {
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
      products
    );
  } catch (error) {
    console.error(error);
    return serverErrorResponse(res, "Server error. Please try again later.");
  }
};

export {
  uploadFilesAndAddProducts,
  getAllProducts,
  deleteProduct,
  singleProudct,
  updateProduct,
  searchProducts,
};
