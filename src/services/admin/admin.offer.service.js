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

const deleteOffer = async (id) => {
  const offer = await Offer.findById(id);
  if (!offer) {
    throw new CustomError(messages.OFFER.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  if (offer.offerType === "Product") {
    await Product.findByIdAndUpdate(offer.offerFor, { DiscountPercentage: 0 });
  } else if (offer.offerType === "Category") {
    await Product.updateMany({ CategoryId: offer.offerFor }, { DiscountPercentage: 0 });
  }

  await Offer.findByIdAndDelete(id);

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.OFFER.DELETED,
  };
};

const editOffer = async (id, { DiscountPercentage }) => {
  const offer = await Offer.findById(id);
  if (!offer) {
    throw new CustomError(messages.OFFER.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  offer.DiscountPercentage = Number(DiscountPercentage);
  await offer.save();

  if (offer.offerType === "Product") {
    await Product.findByIdAndUpdate(offer.offerFor, { DiscountPercentage: Number(DiscountPercentage) });
  } else if (offer.offerType === "Category") {
    await Product.updateMany({ CategoryId: offer.offerFor }, { DiscountPercentage: Number(DiscountPercentage) });
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.OFFER.UPDATE_SUCCESS,
  };
};

export const adminOfferService = {
  processProductOffer,
  processCategoryOffer,
  listOffers,
  deleteOffer,
  editOffer,
};
