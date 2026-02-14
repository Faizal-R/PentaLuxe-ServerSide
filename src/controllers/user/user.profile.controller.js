import Address from "../../models/address.model.js";
import User from "../../models/user.models.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import jwt from "jsonwebtoken";
import { statusCodes } from "../../constants.js";

const getUserProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "User profile retrieved successfully.",
    {
      email: user.email,
      username: user.username,
      phone: user.phone || null,
      isPassword: user.password ? true : false,
    },
  );
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { email, phone, username } = req.body.user;
  const user = req.user;

  user.email = email;
  user.phone = phone;
  user.username = username;

  await user.save();

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "Profile updated successfully",
    user,
  );
});

// Address Management

const getAllAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("addresses");

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "All addresses are received successfully",
      user.addresses,
    );
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Server error while fetching addresses",
    );
  }
};

const createAddress = asyncHandler(async (req, res) => {
  const formState = req.body.formState;
  const addressType = req.body.addressType;

  try {
    const addressData = {
      user: req.user._id,
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
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Failed to create new address",
      );
    }

    const user = req.user;
    user.addresses.push(newAddress._id);
    await user.save();

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "New address added successfully",
      newAddress,
    );
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Server error",
    );
  }
});

const DeleteAddress = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (!id) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Address Id is required.",
      );
    }

    user.addresses = user.addresses.filter(
      (addressId) => addressId.toString() !== id,
    );

    await user.save();
    await Address.findByIdAndDelete(id);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Address deleted successfully.",
    );
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Server error.",
    );
  }
};

const getUserAddressById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Address ID is required.",
    );
  }

  try {
    const address = await Address.findById(id).select("-_id");

    if (!address) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Address not found.",
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Address retrieved successfully with Id",
      address,
    );
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Server error.",
    );
  }
};

const UpdateUserAddress = async (req, res) => {
  const formState = req.body.formState;
  const userId = req.user._id;
  const addressType = req.body.addressType;
  const { addressId } = req.body;

  try {
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
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Address not found",
      );
    }

    Object.assign(address, addressData);
    await address.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Address updated successfully",
      address,
    );
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Error updating address",
      error,
    );
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (user.password && !currentPassword) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Current password is required.",
    );
  }

  if (!user.password && !newPassword) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "New password is required.",
    );
  }

  try {
    if (user.password) {
      const isMatch = await user.isPasswordCorrect(currentPassword);

      if (!isMatch) {
        return createResponse(
          res,
          statusCodes.BAD_REQUEST,
          false,
          "Current password is incorrect.",
        );
      }
    }

    user.password = newPassword;
    await user.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Password changed successfully.",
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
};

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
