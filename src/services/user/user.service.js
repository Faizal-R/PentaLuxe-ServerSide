import User from "../../models/user.models.js";
import { sendOTPEmail } from "../../helpers/EmailOTPSender.js";
import { generateOtp } from "../../utils/GenerateOtp.js";
import { generateAccesTokenAndRefreshToken } from "../../helpers/GenerateTokens.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const registerUser = async ({ username, email, password, phone }) => {
  const userExist = await User.findOne({ email });
  if (userExist) {
    throw new CustomError(messages.AUTH.USER_EXISTS, statusCodes.CONFLICT);
  }

  const otp = generateOtp(4);

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    throw new CustomError(messages.AUTH.OTP_SEND_FAILED, statusCodes.INTERNAL_SERVER_ERROR);
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

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.AUTH.USER_CREATED,
    data: createdUser,
  };
};

const verifyOtp = async ({ otp, email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError(messages.AUTH.USER_NOT_FOUND, statusCodes.BAD_REQUEST);
  }

  if (Date.now() > user.otpExpiryTime) {
    throw new CustomError(messages.AUTH.OTP_EXPIRED, statusCodes.BAD_REQUEST);
  }

  if (user.otp !== otp) {
    throw new CustomError(messages.AUTH.INVALID_OTP, statusCodes.BAD_REQUEST);
  }

  user.isVerified = true;
  user.otp = null;
  await user.save();

  const { accessToken, refreshToken } = await generateAccesTokenAndRefreshToken(user._id);

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.AUTH.OTP_VERIFIED,
    data: { accessToken, refreshToken },
  };
};

const resendOtp = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError(messages.AUTH.USER_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  const otp = generateOtp(4);
  user.otp = otp;
  user.otpExpiryTime = Date.now() + 5 * 60 * 1000;

  await user.save();

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    throw new CustomError(messages.AUTH.OTP_SEND_FAILED, statusCodes.INTERNAL_SERVER_ERROR);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.AUTH.OTP_SENT,
  };
};

const logOutUser = async (userId) => {
  await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.AUTH.LOGOUT_SUCCESS,
  };
};

const logInUser = async ({ email, password }) => {
  if (email.trim() === "" || password.trim() === "") {
    throw new CustomError(messages.AUTH.EMAIL_PASSWORD_REQUIRED, statusCodes.UNAUTHORIZED);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError(messages.AUTH.INVALID_CREDENTIALS, statusCodes.NOT_FOUND);
  }

  if (!user.password) {
    throw new CustomError(messages.AUTH.LOGIN_METHOD_MISMATCH, statusCodes.BAD_REQUEST);
  }

  if (!user.isVerified) {
    throw new CustomError(messages.AUTH.EMAIL_VERIFICATION_REQUIRED, statusCodes.UNAUTHORIZED);
  }

  if (user.status === "BLOCKED") {
    throw new CustomError(messages.AUTH.ACCOUNT_BLOCKED, statusCodes.UNAUTHORIZED);
  }

  const isMatch = await user.isPasswordCorrect(password);

  if (!isMatch) {
    throw new CustomError(messages.AUTH.INVALID_CREDENTIALS, statusCodes.UNAUTHORIZED);
  }

  const { accessToken, refreshToken } = await generateAccesTokenAndRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.AUTH.LOGIN_SUCCESS,
    data: { accessToken, refreshToken },
  };
};

const googleAuth = async ({ username, email }) => {
  const userExist = await User.findOne({ email });

  if (userExist) {
    if (userExist.status === "BLOCKED") {
      throw new CustomError(messages.AUTH.ACCOUNT_BLOCKED, statusCodes.UNAUTHORIZED);
    }

    try {
      const { accessToken, refreshToken } = await generateAccesTokenAndRefreshToken(userExist._id);

      return {
        statusCode: statusCodes.OK,
        success: true,
        message: messages.AUTH.LOGIN_SUCCESS,
        data: { accessToken, refreshToken },
      };
    } catch (error) {
      throw new CustomError(messages.AUTH.TOKEN_GEN_FAILED, statusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  const user = await User.create({
    username,
    email,
    isVerified: true,
  });

  if (!user) {
    throw new CustomError(messages.AUTH.USER_CREATE_FAILED, statusCodes.INTERNAL_SERVER_ERROR);
  }

  const { accessToken, refreshToken } = await generateAccesTokenAndRefreshToken(user._id);

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.AUTH.SIGNUP_SUCCESS,
    data: { user, accessToken, refreshToken },
  };
};

export const userService = {
  registerUser,
  verifyOtp,
  resendOtp,
  logOutUser,
  logInUser,
  googleAuth,
};
