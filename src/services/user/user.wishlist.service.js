import { Variant } from "../../models/variant.model.js";
import Wishlist from "../../models/wishlist.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";
import jwt from "jsonwebtoken";

const AddToWishlist = async (userId, { productId, variant }) => {
  const selectedVarient = await Variant.findOne({ volume: variant });
  if (!selectedVarient) {
    throw new CustomError(messages.CART.INVALID_VOLUME, statusCodes.NOT_FOUND);
  }

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    const WishlistData = {
      user: userId,
      products: [
        {
          product: productId,
          variant: selectedVarient._id,
        },
      ],
    };

    const createdWishlist = await Wishlist.create(WishlistData);

    return {
      statusCode: statusCodes.CREATED,
      success: true,
      message: messages.WISHLIST.ADDED_SUCCESS,
      data: createdWishlist,
    };
  }

  const existingProduct = wishlist.products.find(
    (product) => product.product.toString() === productId,
  );

  if (existingProduct) {
    throw new CustomError(messages.WISHLIST.ALREADY_IN, statusCodes.CONFLICT);
  }

  wishlist.products.push({
    product: productId,
    variant: selectedVarient._id,
  });

  await wishlist.save();

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.WISHLIST.ADDED_SUCCESS,
  };
};

const removeFromWishlist = async (userId, id) => {
  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    throw new CustomError(messages.WISHLIST.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  const updatedProducts = wishlist.products.filter(
    (item) => item.product.toString() !== id,
  );

  wishlist.products = updatedProducts;
  await wishlist.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.WISHLIST.REMOVED,
    data: wishlist,
  };
};

const fetchWishlistProducts = async (token) => {
  if (!token) {
    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.WISHLIST.EMPTY,
      data: [],
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded._id;

    const userWishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: "products.product",
        populate: {
          path: "Variants",
        },
      })
      .populate("products.variant")
      .select("products -_id");

    if (userWishlist) {
      return {
        statusCode: statusCodes.OK,
        success: true,
        message: messages.WISHLIST.RETRIEVED,
        data: userWishlist.products,
      };
    } else {
      return {
        statusCode: statusCodes.OK,
        success: true,
        message: messages.WISHLIST.EMPTY,
        data: [],
      };
    }
  } catch (error) {
    throw new CustomError(messages.COMMON.UNAUTHORIZED, statusCodes.UNAUTHORIZED);
  }
};

const checkProductInWishlist = async (userId, id) => {
  if (!userId) {
    throw new CustomError(messages.AUTH.USER_NOT_FOUND, statusCodes.OK, false);
  }

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    return {
      statusCode: statusCodes.OK,
      success: false,
      message: messages.WISHLIST.NOT_FOUND,
    };
  }

  const isInWishlist = wishlist.products.find(
    (product) => product.product.toString() === id,
  );

  return {
    statusCode: statusCodes.OK,
    success: isInWishlist ? true : false,
  };
};

export const wishlistService = {
  AddToWishlist,
  removeFromWishlist,
  fetchWishlistProducts,
  checkProductInWishlist,
};
