import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { adminOfferService } from "../../services/admin/admin.offer.service.js";

const processProductOffer = asyncHandler(async (req, res) => {
  const { DiscountPercentage, itemId } = req.body;
  const result = await adminOfferService.processProductOffer({ DiscountPercentage, itemId });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const processCategoryOffer = asyncHandler(async (req, res) => {
  const { itemId, DiscountPercentage } = req.body;
  const result = await adminOfferService.processCategoryOffer({ itemId, DiscountPercentage });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const ListOffers = asyncHandler(async (req, res) => {
  const result = await adminOfferService.listOffers();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { processProductOffer, processCategoryOffer, ListOffers };
