import Offer from "../../models/offer.model.js";
import Product from "../../models/product.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const processProductOffer = async ({ DiscountPercentage, itemId }) => {
  const offer = await Offer.create({
    DiscountPercentage,
    offerType: "Product",
    offerFor: itemId,
  });

  const product = await Product.findByIdAndUpdate(
    itemId,
    { DiscountPercentage },
    { new: true }
  );

  if (!product) {
    throw new CustomError(messages.PRODUCT.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.OFFER.UPDATE_SUCCESS,
  };
};

const processCategoryOffer = async ({ itemId, DiscountPercentage }) => {
  const products = await Product.find({ CategoryId: itemId });

  if (products.length === 0) {
    throw new CustomError(messages.PRODUCT.SEARCH_EMPTY, statusCodes.NOT_FOUND);
  }

  await Promise.all(
    products.map(async (product) => {
      product.DiscountPercentage = Number(DiscountPercentage);
      await product.save();
    })
  );

  await Offer.create({
    DiscountPercentage: Number(DiscountPercentage),
    offerType: "Category",
    offerFor: itemId,
  });

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.OFFER.UPDATE_SUCCESS,
  };
};

const listOffers = async () => {
  const offers = await Offer.find()
    .populate("offerFor")
    .sort({ createdAt: -1 });

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.OFFER.RETRIEVED,
    data: offers,
  };
};

export const adminOfferService = {
  processProductOffer,
  processCategoryOffer,
  listOffers,
};
