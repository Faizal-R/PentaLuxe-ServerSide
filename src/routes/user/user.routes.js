import express from "express";

import {
  logOutUser,
  registerUser,
  resendOtp,
  VerifyOtp,
  logInUser,
  googleAuth,
} from "../../controllers/user/auth.controllers.js";
import verifyToken from "../../middlewares/verifyToken.middlerware.js";
import userStatus from "../../middlewares/userStatus.middleware.js"; // Make sure the path is correct
import {
  getProducts,
  getRelatedProducts,
  productDetails,
  searchProductsByCategory,
} from "../../controllers/user/user.product.controller.js";
import { getCategories } from "../../controllers/admin/admin.controller.js";
import { getAllProductsByCategory } from "../../controllers/user/user.category.controller.js";
import {
  changePassword,
  createAddress,
  DeleteAddress,
  getAllAddresses,
  getUserAddressById,
  getUserProfile,
  UpdateUserAddress,
  updateUserProfile,
} from "../../controllers/user/user.profile.controller.js";
import {
  addToCart,
  changeProductQuantity,
  getUserCart,
  removeProduct,
  updateCartTotalPrice,
} from "../../controllers/user/user.cart.controller.js";
import {
  cancelOrReturnOrder,
  getUserOrders,
} from "../../controllers/user/user.order.controller.js";
import {
  createRazorpayOrder,
  handlePaymentFailed,
  handleWalletPayment,
  paymentVerification,
  placeOrder,
} from "../../controllers/user/user.checkout.controller.js";
import { getAllCoupons } from "../../controllers/admin/admin.coupon.controller.js";
import {
  AddToWishlist,
  checkProductInWishlist,
  fetchWishlistProducts,
  removeFromWishlist,
} from "../../controllers/user/user.wishlist.controller.js";
import { getUserWallet } from "../../controllers/user/user.wallet.controller.js";
import { searchUsers } from "../../controllers/admin/admin.user.controller.js";

const router = express.Router();

// Authentication routes
router.post("/register", registerUser);
router.post("/otp-verify", VerifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/logout", verifyToken, logOutUser);
router.post("/login", logInUser);
router.post("/google-auth", googleAuth);

// User profile routes with userStatus middleware
router.get("/profile", verifyToken, userStatus, getUserProfile);
router.put("/profile", verifyToken, userStatus, updateUserProfile);
router.patch("/change-password", verifyToken, userStatus, changePassword);

// Address book routes with userStatus middleware
router.post("/address-book", verifyToken, userStatus, createAddress);
router.get("/address-book", verifyToken, userStatus, getAllAddresses);
router.get("/address-book/:id", verifyToken, userStatus, getUserAddressById);
router.put("/address-book", verifyToken, userStatus, UpdateUserAddress);
router.delete("/address-book/:id", verifyToken, userStatus, DeleteAddress);

// Product routes with userStatus middleware
router.get("/products", userStatus, getProducts);
router.get("/products/:id", productDetails);
router.get("/related-products", getRelatedProducts);
router.get("/search-products-by-category", searchProductsByCategory);

// Category routes
router.get("/categories", getCategories);
router.get("/categories/:id", userStatus, getAllProductsByCategory);

// Cart routes with userStatus middleware
router.get("/cart", userStatus, getUserCart);
router.post("/cart", verifyToken, userStatus, addToCart);
router.delete("/cart/:id", verifyToken, userStatus, removeProduct);
router.patch("/cart", verifyToken, userStatus, changeProductQuantity);
router.patch("/cart-total", verifyToken, userStatus, updateCartTotalPrice);

// Order routes with userStatus middleware
router.get("/orders", verifyToken, userStatus, getUserOrders);
router.patch("/orders", verifyToken, userStatus, cancelOrReturnOrder);
router.post("/place-order", verifyToken, userStatus, placeOrder);

// Payment routes with userStatus middleware
router.post(
  "/create-razorpay-order",
  verifyToken,
  userStatus,
  createRazorpayOrder,
);
router.post(
  "/verify-payment-and-create-order",
  verifyToken,
  userStatus,
  paymentVerification,
);
router.post(
  "/razorpay-payment-failure",
  verifyToken,
  userStatus,
  handlePaymentFailed,
);

router.put(
  "/order-retry-payment",
  verifyToken,
  userStatus,
  paymentVerification,
);
router.get("/getkey", async (req, res) => {
  console.log("razopayKey", process.env.RAZORPAY_API_KEY);
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
});

// Coupons routes
router.get("/coupons", userStatus, getAllCoupons);

// Wishlist routes with userStatus middleware
router.post("/wishlist", verifyToken, userStatus, AddToWishlist);
router.delete("/wishlist/:id", verifyToken, userStatus, removeFromWishlist);
router.get("/wishlist", userStatus, fetchWishlistProducts);
router.get("/wishlist/:id", userStatus, checkProductInWishlist);

router.get("/wallet", verifyToken, userStatus, getUserWallet);
router.post("/wallet-payment", verifyToken, handleWalletPayment);

export default router;
