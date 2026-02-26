import User from "../../models/user.models.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const getAllUser = async () => {
  const users = await User.find({ isVerified: true })
    .populate("addresses")
    .select("username email status phone addresses")
    .sort({ createdAt: -1 });

  if (!users || users.length < 1) {
    throw new CustomError(messages.ADMIN.USER_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.USER_FETCHED,
    data: users,
  };
};

const updateUserStatus = async ({ id, status }) => {
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { status: status === "ACTIVE" ? "BLOCKED" : "ACTIVE" },
    { new: true }
  );

  if (!updatedUser) {
    throw new CustomError(messages.ADMIN.USER_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.USER_STATUS_UPDATED,
    data: updatedUser,
  };
};

const searchUsers = async (text) => {
  if (!text) {
    throw new CustomError(messages.COMMON.BAD_REQUEST, statusCodes.BAD_REQUEST);
  }

  const users = await User.find({
    username: new RegExp(text, "i"),
  })
    .populate("addresses")
    .select("username email status phone addresses");

  if (!users || users.length === 0) {
    throw new CustomError(messages.ADMIN.USER_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.USER_FETCHED,
    data: users,
  };
};

export const adminUserService = {
  getAllUser,
  updateUserStatus,
  searchUsers,
};
