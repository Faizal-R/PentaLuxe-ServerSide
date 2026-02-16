import jwt from "jsonwebtoken";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import { Variant } from "../../models/variant.model.js";
import Wishlist from "../../models/wishlist.model.js";
import { statusCodes } from "../../constant/statusCodes.js";

const AddToWishlist = async (req, res) => {
  const { productId, variant } = req.body;
  const userId = req.user._id;

  const selectedVarient = await Variant.findOne({ volume: variant });
  if (!selectedVarient) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "Selected Variant is Not Found",
    );
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

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "Product Added to Wishlist",
      createdWishlist,
    );
  }

  const existingProduct = await wishlist.products.find(
    (product) => product.product._id.toString() === productId,
  );

  if (existingProduct) {
    return createResponse(
      res,
      statusCodes.CONFLICT,
      false,
      "Product Already In the Wishlist",
    );
  }

  wishlist.products.push({
    product: productId,
    variant: selectedVarient._id,
  });

  await wishlist.save();

  return createResponse(
    res,
    statusCodes.CREATED,
    true,
    "Product Added to Wishlist",
  );
};

const removeFromWishlist = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Wishlist not found",
      );
    }

    const updatedProducts = wishlist.products.filter(
      (item) => item.product.toString() !== id,
    );

    wishlist.products = updatedProducts;
    await wishlist.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Product removed from wishlist",
      wishlist,
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
};

const fetchWishlistProducts = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
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
        return createResponse(
          res,
          statusCodes.OK,
          true,
          "Wishlist retrieved successfully",
          userWishlist.products,
        );
      } else {
        return createResponse(
          res,
          statusCodes.OK,
          true,
          "Wishlist is empty",
          [],
        );
      }
    } catch (error) {
      return createResponse(
        res,
        statusCodes.UNAUTHORIZED,
        false,
        "Invalid or expired token",
      );
    }
  }

  return createResponse(res, statusCodes.OK, true, "Wishlist is empty", []);
};

const checkProductInWishlist = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return createResponse(res, statusCodes.OK, false, "No User found");
  }

  try {
    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return createResponse(res, statusCodes.OK, false, "Wishlist not found");
    }

    const isInWishlist = wishlist.products.find(
      (product) => product.product._id.toString() === id,
    );

    return createResponse(res, statusCodes.OK, isInWishlist ? true : false);
  } catch (error) {
    return serverErrorResponse(res);
  }
};

export {
  AddToWishlist,
  removeFromWishlist,
  fetchWishlistProducts,
  checkProductInWishlist,
};
