import User from "../../models/user.models.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import { statusCodes } from "../../constants.js";

const getAllUser = asyncHandler(async (req, res) => {
  const users = await User.find({ isVerified: true })
    .populate("addresses")
    .select("username email status phone addresses")
    .sort({ createdAt: -1 });

  console.log("usersInAdminCOnt", users);

  if (!users || users.length < 1) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "No Users Founded"
    );
  }

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "All Users Fetched Successfully",
    users
  );
});

const updateUserStatus = asyncHandler(async (req, res) => {
  console.log("insdie UpdateUser");

  const { id, status } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status: status === "ACTIVE" ? "BLOCKED" : "ACTIVE" },
      { new: true }
    );

    console.log("updatedUser", updatedUser);

    if (!updatedUser) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "User not found"
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "User status updated",
      updatedUser
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
});

const searchUsers = async (req, res) => {
  console.log("Inside the admin user search");

  const { text } = req.body;
  console.log(text);

  if (!text) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "No text provided."
    );
  }

  try {
    const users = await User.find({
      username: new RegExp(text, "i"),
    })
      .populate("addresses")
      .select("username email status phone addresses");

    console.log(users);

    if (!users || users.length === 0) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "No users found."
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Users found.",
      users
    );
  } catch (error) {
    return serverErrorResponse(
      res,
      "Server error. Please try again later."
    );
  }
};

export {
  getAllUser,
  updateUserStatus,
  searchUsers,
};
