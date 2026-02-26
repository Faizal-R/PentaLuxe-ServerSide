import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import jwt from "jsonwebtoken";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const addToCart = async (userId, { productId, volume }) => {
  const product = await Product.findById(productId)
    .populate("Variants")
    .populate("CategoryId");

  if (!product) {
    throw new CustomError(messages.CART.PRODUCT_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  const selectedVariant = product.Variants.find(
    (variant) => variant.volume === volume
  );

  if (!selectedVariant) {
    throw new CustomError(messages.CART.INVALID_VOLUME, statusCodes.BAD_REQUEST);
  }

  if (selectedVariant.stock === 0) {
    throw new CustomError(messages.CART.OUT_OF_STOCK, statusCodes.BAD_REQUEST);
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      products: [
        { product: productId, quantity: 1, variant: selectedVariant._id },
      ],
    });

    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.CART.ADDED_SUCCESS,
      data: cart.products[0],
    };
  }

  const existingProduct = cart.products.find(
    (product) =>
      product.product.toString() === productId &&
      product.variant.toString() === selectedVariant._id.toString()
  );

  if (existingProduct) {
    throw new CustomError(messages.CART.ALREADY_IN_CART, statusCodes.CONFLICT);
  }

  cart.products.push({
    product: productId,
    quantity: 1,
    variant: selectedVariant._id,
  });

  await cart.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.CART.ADDED_SUCCESS,
    data: cart.products[cart.products.length - 1],
  };
};

const getUserCart = async (token) => {
  if (!token) {
    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.CART.EMPTY,
      data: [],
    };
  }

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
      return {
        statusCode: statusCodes.OK,
        success: true,
        message: messages.CART.RETRIEVED,
        data: userCart.products,
      };
    }

    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.CART.EMPTY,
      data: [],
    };
  } catch (error) {
    throw new CustomError(messages.COMMON.UNAUTHORIZED, statusCodes.UNAUTHORIZED);
  }
};

const changeProductQuantity = async (userId, { itemId, action, stock }) => {
  if (!itemId) {
    throw new CustomError(messages.CART.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const userCart = await Cart.findOne({ user: userId });

  if (!userCart) {
    throw new CustomError(messages.CART.ITEM_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  const product = userCart.products.find(
    (product) => product._id.toString() === itemId
  );

  if (!product) {
    throw new CustomError(messages.CART.ITEM_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  switch (action) {
    case "INC":
      if (product.quantity < 10) {
        if (product.quantity >= stock) {
          throw new CustomError(messages.CART.STOCK_LIMIT, statusCodes.BAD_REQUEST);
        }
        product.quantity += 1;
      } else {
        throw new CustomError(messages.CART.QUANTITY_LIMIT, statusCodes.BAD_REQUEST);
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
      throw new CustomError(messages.COMMON.BAD_REQUEST, statusCodes.BAD_REQUEST);
  }

  await userCart.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.CART.QUANTITY_UPDATED,
    data: userCart,
  };
};

const removeProduct = async (userId, id) => {
  if (!id) {
    throw new CustomError(messages.CART.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new CustomError(messages.CART.ITEM_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  const productIndex = cart.products.findIndex(
    (product) => product._id.toString() === id
  );

  if (productIndex === -1) {
    throw new CustomError(messages.CART.ITEM_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  cart.products.splice(productIndex, 1);
  await cart.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.CART.REMOVED,
  };
};

const updateCartTotalPrice = async (userId, totalPrice) => {
  if (!totalPrice) {
    throw new CustomError(messages.CART.PRICE_REQUIRED, statusCodes.BAD_REQUEST);
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new CustomError(messages.CART.ITEM_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  cart.totalPrice = totalPrice;
  await cart.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.CART.PRICE_UPDATED,
  };
};

export const cartService = {
  addToCart,
  getUserCart,
  changeProductQuantity,
  removeProduct,
  updateCartTotalPrice,
};
