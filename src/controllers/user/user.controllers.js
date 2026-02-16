import User from "../../models/user.models.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { sendOTPEmail } from "../../helpers/EmailOTPSender.js";
import { generateOtp } from "../../utils/GenerateOtp.js";
import { generateAccesTokenAndRefreshToken } from "../../helpers/GenerateTokens.js";
import { createResponse } from "../../helpers/responseHandler.js";
import {statusCodes} from '../../constant/statusCodes.js'

// REGISTER
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, phone } = req.body;

  const userExist = await User.findOne({ email });
  if (userExist) {
    return createResponse(
      res,
      statusCodes.CONFLICT,
      false,
      "User Already Exists",
    );
  }

  const otp = generateOtp(4);

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Failed to send OTP email.",
    );
  }

  const user = await User.create({
    username,
    email,
    password,
    otp,
    phone,
    otpExpiryTime: Date.now() + 5 * 60 * 1000,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -otp -refreshToken",
  );

  return createResponse(
    res,
    statusCodes.CREATED,
    true,
    "User created successfully. Please verify your OTP.",
    createdUser,
  );
});

// VERIFY OTP
const VerifyOtp = asyncHandler(async (req, res) => {
  const { otp, email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "No account found with this email address.",
      );
    }

    if (Date.now() > user.otpExpiryTime) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "OTP has expired.",
      );
    }

    if (user.otp === otp) {
      user.isVerified = true;
      user.otp = null;
      await user.save();

      const { accessToken, refreshToken } =
        await generateAccesTokenAndRefreshToken(user._id);

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "OTP verification successfully completed.",
        { accessToken, refreshToken },
      );
    } else {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "Invalid OTP. Please try again.",
      );
    }
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "An error occurred during OTP verification.",
    );
  }
});

// RESEND OTP
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return createResponse(res, statusCodes.NOT_FOUND, false, "User not found");
  }

  const otp = generateOtp(4);
  user.otp = otp;
  user.otpExpiryTime = Date.now() + 5 * 60 * 1000;

  await user.save();

  try {
    await sendOTPEmail(email, otp);
    return createResponse(
      res,
      statusCodes.OK,
      true,
      `OTP sent successfully to ${email}`,
    );
  } catch (error) {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Failed to send OTP email",
    );
  }
});

// LOGOUT
const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  return createResponse(res, statusCodes.OK, true, "User Logout Successfully");
});

// LOGIN
const logInUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (email.trim() === "" || password.trim() === "") {
    return createResponse(
      res,
      statusCodes.UNAUTHORIZED,
      false,
      "Email and Password are required",
    );
  }

  const user = await User.findOne({ email });

  if (!user.password) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "You can Try another login Method",
    );
  }

  if (!user) {
    return createResponse(
      res,
      statusCodes.NOT_FOUND,
      false,
      "Invalid Email Or Password",
    );
  }

  if (!user.isVerified) {
    return createResponse(
      res,
      statusCodes.UNAUTHORIZED,
      false,
      "Please verify your email to activate your account",
    );
  }

  if (user.status === "BLOCKED") {
    return createResponse(
      res,
      statusCodes.UNAUTHORIZED,
      false,
      "User Account Has been Blocked",
    );
  }

  const isMatch = await user.isPasswordCorrect(password);

  if (!isMatch) {
    return createResponse(
      res,
      statusCodes.UNAUTHORIZED,
      false,
      "Invalid Email Or Password",
    );
  }

  const { accessToken, refreshToken } = await generateAccesTokenAndRefreshToken(
    user._id,
  );

  user.refreshToken = refreshToken;
  await user.save();

  return createResponse(
    res,
    statusCodes.OK,
    true,
    "User logged in successfully",
    { accessToken, refreshToken },
  );
});

// GOOGLE AUTH
const googleAuth = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  const userExist = await User.findOne({ email });

  if (userExist) {
    if (userExist.status === "BLOCKED") {
      return createResponse(
        res,
        statusCodes.UNAUTHORIZED,
        false,
        "User Account Has been Blocked",
      );
    }

    try {
      const { accessToken, refreshToken } =
        await generateAccesTokenAndRefreshToken(userExist._id);

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "User Logged In Successfully",
        { accessToken, refreshToken },
      );
    } catch (error) {
      return createResponse(
        res,
        statusCodes.INTERNAL_SERVER_ERROR,
        false,
        "Failed to generate tokens",
      );
    }
  }

  const user = await User.create({
    username,
    email,
    isVerified: true,
  });

  if (user) {
    const { accessToken, refreshToken } =
      await generateAccesTokenAndRefreshToken(user._id);

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "User Signed Up Successfully",
      { user, accessToken, refreshToken },
    );
  } else {
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      "Failed to create user",
    );
  }
});

export {
  registerUser,
  VerifyOtp,
  resendOtp,
  logOutUser,
  logInUser,
  googleAuth,
};
