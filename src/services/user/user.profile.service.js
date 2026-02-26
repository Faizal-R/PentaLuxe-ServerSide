import Address from "../../models/address.model.js";
import User from "../../models/user.models.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const getUserProfile = async (user) => {
  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PROFILE.RETRIEVED,
    data: {
      email: user.email,
      username: user.username,
      phone: user.phone || null,
      isPassword: !!user.password,
    },
  };
};

const updateUserProfile = async (user, { email, phone, username }) => {
  user.email = email;
  user.phone = phone;
  user.username = username;
  await user.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PROFILE.UPDATE_SUCCESS,
    data: user,
  };
};

const getAllAddresses = async (userId) => {
  const user = await User.findById(userId).populate("addresses");
  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADDRESS.RETRIEVED,
    data: user.addresses,
  };
};

const createAddress = async (user, { formState, addressType }) => {
  const addressData = {
    user: user._id,
    Name: formState.Name,
    FlatNumberOrBuildingName: formState.FlatNumberOrBuildingName,
    Locality: formState.Locality,
    Landmark: formState.Landmark,
    District: formState.District,
    State: formState.State,
    Pincode: formState.Pincode,
    Phone: formState.Phone,
    addressType,
  };

  const newAddress = await Address.create(addressData);

  if (!newAddress) {
    throw new CustomError(messages.ADDRESS.CREATE_FAILED, statusCodes.INTERNAL_SERVER_ERROR);
  }

  user.addresses.push(newAddress._id);
  await user.save();

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.ADDRESS.CREATED,
    data: newAddress,
  };
};

const deleteAddress = async (user, id) => {
  if (!id) {
    throw new CustomError(messages.ADDRESS.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  user.addresses = user.addresses.filter(
    (addressId) => addressId.toString() !== id
  );

  await user.save();
  await Address.findByIdAndDelete(id);

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADDRESS.DELETED,
  };
};

const getUserAddressById = async (id) => {
  if (!id) {
    throw new CustomError(messages.ADDRESS.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const address = await Address.findById(id).select("-_id");

  if (!address) {
    throw new CustomError(messages.ADDRESS.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADDRESS.RETRIEVED,
    data: address,
  };
};

const updateUserAddress = async (userId, { formState, addressType, addressId }) => {
  const addressData = {
    user: userId,
    Name: formState.Name,
    FlatNumberOrBuildingName: formState.FlatNumberOrBuildingName,
    Locality: formState.Locality,
    Landmark: formState.Landmark,
    District: formState.District,
    State: formState.State,
    Pincode: formState.Pincode,
    Phone: formState.Phone,
    addressType,
  };

  const address = await Address.findById(addressId);

  if (!address) {
    throw new CustomError(messages.ADDRESS.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  Object.assign(address, addressData);
  await address.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADDRESS.UPDATED,
    data: address,
  };
};

const changePassword = async (user, { currentPassword, newPassword }) => {
  if (user.password && !currentPassword) {
    throw new CustomError(messages.PROFILE.PASSWORD_REQUIRED, statusCodes.BAD_REQUEST);
  }

  if (!user.password && !newPassword) {
    throw new CustomError(messages.PROFILE.NEW_PASSWORD_REQUIRED, statusCodes.BAD_REQUEST);
  }

  if (user.password) {
    const isMatch = await user.isPasswordCorrect(currentPassword);
    if (!isMatch) {
      throw new CustomError(messages.PROFILE.INCORRECT_PASSWORD, statusCodes.BAD_REQUEST);
    }
  }

  user.password = newPassword;
  await user.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.PROFILE.PASSWORD_CHANGED,
  };
};

export const profileService = {
  getUserProfile,
  updateUserProfile,
  getAllAddresses,
  createAddress,
  deleteAddress,
  getUserAddressById,
  updateUserAddress,
  changePassword,
};
