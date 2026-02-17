import express from "express";
import {
  adminLogin,
  getCategories,
  deleteCategory,
  uploadFilesAndAddCategory,
  EditCategory,

} from "../../controllers/admin/admin.controller.js";
import { uploader } from "../../middlewares/multer.middlerware.js";
import {
  deleteProduct,
  getAllProducts,
  searchProducts,
  singleProudct,
  updateProduct,
  uploadFilesAndAddProducts,
} from "../../controllers/admin/admin.product.controller.js";
import {
  getAllUser,
  searchUsers,
  updateUserStatus,
} from "../../controllers/admin/admin.user.controller.js";
import {
  changeOrderStatus,
  getAllOrders,
} from "../../controllers/admin/admin.order.controller.js";
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
} from "../../controllers/admin/admin.coupon.controller.js";
import {
  ListOffers,
  processCategoryOffer,
  processProductOffer,
} from "../../controllers/admin/admin.offer.controller.js";
import { generateSalesReport } from "../../controllers/admin/admin.sales.controller.js";
import {
  bestSellingCategories,
  bestSellingProducts,
  getAdminDashboard,
} from "../../controllers/admin/admin.dashboard.controller.js";
import adminVerifyToken from "../../middlewares/adminVerifyToken.middleware.js";

const router = express.Router();

// Admin routes
router.post("/login", adminLogin);


// router.use(adminVerifyToken);


// Category routes
router.post(
  "/upload-category",
  uploader.single("categoryImage"),
  uploadFilesAndAddCategory
);
router.get("/categories", getCategories);
router.delete("/categories/:id", deleteCategory);
router.put("/categories", uploader.single("categoryImage"), EditCategory);



// Product routes
router.post("/products", uploader.any(), uploadFilesAndAddProducts);
router.put("/products/:id", uploader.single('file'), updateProduct);

router.get("/products", getAllProducts);
router.delete("/products/:id", deleteProduct);
router.get("/products/:id", singleProudct);
router.post("/search-products", searchProducts);

// Customer routes
router.get("/customers", getAllUser);
router.post("/search-user", searchUsers);

// Status update route
router.patch("/statusUpdate", updateUserStatus);

// Orders routes
router.get("/orders", getAllOrders);
router.patch("/orders", changeOrderStatus);

// Coupon routes
router.post("/coupon", createCoupon);
router.get("/coupon", getAllCoupons);
router.delete("/coupon/:id", deleteCoupon);

// Offer
router.patch("/product-offer", processProductOffer);
router.patch("/category-offer", processCategoryOffer);
router.get('/offers',ListOffers)

// Sales report
router.post("/sales-report", generateSalesReport);
router.get("/dashboard", getAdminDashboard);
router.get("/best-selling-products", bestSellingProducts);
router.get("/best-selling-categories", bestSellingCategories);

export default router;
