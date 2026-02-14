import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import Coupon from "../../models/coupon.model.js";
import jwt from "jsonwebtoken";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import { statusCodes } from "../../constants.js";

const addToCart = async (req, res) => {
  const { productId, volume } = req.body;
  const user = req.user;

  try {
    const product = await Product.findById(productId)
      .populate("Variants")
      .populate("CategoryId");

    console.log("addtocart", product);

    if (!product) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Product Not Found"
      );
    }

    const selectedVariant = product.Variants.find(
      (variant) => variant.volume === volume
    );

    if (!selectedVariant) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "Invalid product volume selected"
      );
    }

    if (selectedVariant.stock === 0) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "Sorry, this item is currently unavailable"
      );
    }

    let cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      cart = await Cart.create({
        user: user._id,
        products: [
          { product: productId, quantity: 1, variant: selectedVariant._id },
        ],
      });

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "Product Added to the cart Successfully",
        cart.products[0]
      );
    }

    const existingProduct = cart.products.find(
      (product) =>
        product.product.toString() === productId &&
        product.variant.toString() === selectedVariant._id.toString()
    );

    if (existingProduct) {
      return createResponse(
        res,
        statusCodes.CONFLICT,
        false,
        "Product Already in the Cart"
      );
    }

    cart.products.push({
      product: productId,
      quantity: 1,
      variant: selectedVariant._id,
    });

    await cart.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Product Added to the cart Successfully",
      cart.products[cart.products.length - 1]
    );
  } catch (error) {
    console.error(error);
    return serverErrorResponse(
      res,
      "An error occurred while adding the product"
    );
  }
};

const getUserCart = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded._id;

      const userCart = await Cart.findOne({ user: userId })
        .populate({
          path: "products.product",
          populate: {
            path: "CategoryId",
            select: "categoryName",
          },
        })
        .populate("products.variant")
        .select("products -_id");

      if (userCart) {
        return createResponse(
          res,
          statusCodes.OK,
          true,
          "Cart retrieved successfully",
          userCart.products
        );
      }

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "Cart is empty",
        []
      );
    } catch (error) {
      console.error("Token verification error:", error);
      return createResponse(
        res,
        statusCodes.UNAUTHORIZED,
        false,
        "Invalid or expired token"
      );
    }
  }

  return createResponse(res, statusCodes.OK, true, "Cart is empty", []);
};

const changeProductQuantity = async (req, res) => {
  const { itemId, action, stock } = req.body;

  if (!itemId) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Item ID is Required"
    );
  }

  const userId = req.user._id;

  try {
    const userCart = await Cart.findOne({ user: userId });

    if (!userCart) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Cart Not Found"
      );
    }

    const product = userCart.products.find(
      (product) => product._id.toString() === itemId
    );

    if (!product) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Item not found in cart"
      );
    }

    switch (action) {
      case "INC":
        if (product.quantity < 10) {
          if (product.quantity >= stock) {
            return createResponse(
              res,
              statusCodes.BAD_REQUEST,
              false,
              "Stock limit reached"
            );
          }
          product.quantity += 1;
        } else {
          return createResponse(
            res,
            statusCodes.BAD_REQUEST,
            false,
            "Limit of 10 items per person reached"
          );
        }
        break;

      case "DEC":
        if (product.quantity > 1) {
          product.quantity -= 1;
        } else {
          userCart.products = userCart.products.filter(
            (prod) => prod._id.toString() !== itemId
          );
        }
        break;

      default:
        return createResponse(
          res,
          statusCodes.BAD_REQUEST,
          false,
          "Invalid action"
        );
    }

    await userCart.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Product quantity updated",
      userCart
    );
  } catch (error) {
    console.error("Error updating product quantity:", error);
    return serverErrorResponse(res, "Server error");
  }
};

const removeProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!id) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Product ID is Required"
    );
  }

  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Cart not found"
      );
    }

    const productIndex = cart.products.findIndex(
      (product) => product._id.toString() === id
    );

    if (productIndex === -1) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Product not found in cart"
      );
    }

    cart.products.splice(productIndex, 1);
    await cart.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Product removed from cart"
    );
  } catch (err) {
    return serverErrorResponse(res, "Error removing product from cart");
  }
};

const updateCartTotalPrice = async (req, res) => {
  const { totalPrice } = req.body;
  const userId = req.user.id;

  if (!totalPrice) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Total price is required"
    );
  }

  try {
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Cart not found"
      );
    }

    cart.totalPrice = totalPrice;
    await cart.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Total Price Updated Successfully"
    );
  } catch (error) {
    return serverErrorResponse(
      res,
      "An error occurred while updating the total price"
    );
  }
};

export {
  addToCart,
  getUserCart,
  changeProductQuantity,
  removeProduct,
  updateCartTotalPrice,
};
