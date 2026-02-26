import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { profileService } from "../../services/user/user.profile.service.js";

const getUserProfile = asyncHandler(async (req, res) => {
  const result = await profileService.getUserProfile(req.user);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { email, phone, username } = req.body.user;
  const result = await profileService.updateUserProfile(req.user, { email, phone, username });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Address Management
const getAllAddresses = asyncHandler(async (req, res) => {
  const result = await profileService.getAllAddresses(req.user._id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const createAddress = asyncHandler(async (req, res) => {
  const { formState, addressType } = req.body;
  const result = await profileService.createAddress(req.user, { formState, addressType });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const DeleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await profileService.deleteAddress(req.user, id);
  return createResponse(res, result.statusCode, result.success, result.message);
});

const getUserAddressById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await profileService.getUserAddressById(id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const UpdateUserAddress = asyncHandler(async (req, res) => {
  const { formState, addressType, addressId } = req.body;
  const result = await profileService.updateUserAddress(req.user._id, { formState, addressType, addressId });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await profileService.changePassword(req.user, { currentPassword, newPassword });
  return createResponse(res, result.statusCode, result.success, result.message);
});

export {
  DeleteAddress,
  getUserProfile,
  updateUserProfile,
  createAddress,
  getAllAddresses,
  getUserAddressById,
  UpdateUserAddress,
  changePassword,
};
