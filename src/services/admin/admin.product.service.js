import { uploadOnCloudinary } from "../../helpers/cloudinary.js";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import { Variant } from "../../models/variant.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";
import qs from "qs";

const uploadFilesAndAddProducts = async (files, body) => {
  const parsedBody = qs.parse(body);
  const {
    Name,
    categoryName,
    ScentType,
    Description,
    Gender,
    DiscountPercentage,
    productVolumes,
  } = parsedBody;

  if (!files || files.length === 0) {
    throw new CustomError(messages.ADMIN.FILE_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const response = await uploadOnCloudinary(files);

  if (!response || response.length === 0) {
    throw new CustomError(messages.COMMON.SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
  }

  const category = await Category.findOne({ categoryName });

  if (!category) {
    throw new CustomError(messages.ADMIN.CATEGORY_NOT_FOUND, statusCodes.NOT_FOUND);
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

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.ADMIN.PRODUCT_ADDED,
    data: product,
  };
};

const getAllProducts = async () => {
  const products = await Product.find()
    .populate("CategoryId")
    .populate("Variants")
    .sort({ createdAt: -1 });

  const filteredProducts = products.filter(
    (product) => product.CategoryId !== null
  );

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PRODUCT.FETCH_SUCCESS,
    data: filteredProducts,
  };
};

const deleteProduct = async (id) => {
  if (!id) {
    throw new CustomError(messages.PRODUCT.ID_REQUIRED, statusCodes.NOT_FOUND);
  }

  const deletedProduct = await Product.findByIdAndDelete(id);

  if (!deletedProduct) {
    throw new CustomError(messages.PRODUCT.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.PRODUCT_DELETED,
    data: deletedProduct,
  };
};

const singleProduct = async (id) => {
  if (!id) {
    throw new CustomError(messages.PRODUCT.ID_REQUIRED, statusCodes.NOT_FOUND);
  }

  const product = await Product.findById(id)
    .populate("CategoryId")
    .populate("Variants");

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

const updateProduct = async (id, file, body) => {
  const {
    Name,
    Gender,
    categoryName,
    DiscountPercentage,
    Description,
    ScentType,
  } = body;

  const Quantities = JSON.parse(body.Quantities);
  const existingImages = JSON.parse(body.existingImages);

  if (file) {
    const response = await uploadOnCloudinary(file);
    if (!response || response.length === 0) {
      throw new CustomError(messages.COMMON.SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
    }
    existingImages.push(response[0]);
  }

  const category = await Category.findOne({ categoryName });
  if (!category) {
    throw new CustomError(messages.ADMIN.CATEGORY_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  const product = await Product.findById(id).populate("Variants");

  if (!product) {
    throw new CustomError(messages.PRODUCT.NOT_FOUND, statusCodes.NOT_FOUND);
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

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.PRODUCT_UPDATED,
  };
};

const searchProducts = async (text) => {
  if (!text) {
    throw new CustomError(messages.COMMON.BAD_REQUEST, statusCodes.BAD_REQUEST);
  }

  const products = await Product.find({
    Name: new RegExp(text, "i"),
  }).populate("CategoryId");

  if (!products || products.length === 0) {
    throw new CustomError(messages.PRODUCT.SEARCH_EMPTY, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PRODUCT.SEARCH_SUCCESS,
    data: products,
  };
};

export const adminProductService = {
  uploadFilesAndAddProducts,
  getAllProducts,
  deleteProduct,
  singleProduct,
  updateProduct,
  searchProducts,
};
