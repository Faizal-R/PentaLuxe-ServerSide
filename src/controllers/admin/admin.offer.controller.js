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

const deleteOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminOfferService.deleteOffer(id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const editOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { DiscountPercentage } = req.body;
  const result = await adminOfferService.editOffer(id, { DiscountPercentage });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { processProductOffer, processCategoryOffer, ListOffers, deleteOffer, editOffer };
