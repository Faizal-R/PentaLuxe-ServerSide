import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { wishlistService } from "../../services/user/user.wishlist.service.js";

const AddToWishlist = asyncHandler(async (req, res) => {
  const { productId, variant } = req.body;
  const userId = req.user._id;
  const result = await wishlistService.AddToWishlist(userId, { productId, variant });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const result = await wishlistService.removeFromWishlist(userId, id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const fetchWishlistProducts = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const result = await wishlistService.fetchWishlistProducts(token);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const checkProductInWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const result = await wishlistService.checkProductInWishlist(userId, id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export {
  AddToWishlist,
  removeFromWishlist,
  fetchWishlistProducts,
  checkProductInWishlist,
};
