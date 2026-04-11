import { asyncHandler } from "../../helpers/asyncHandler.js";
import { createResponse } from "../../helpers/responseHandler.js";
import { authService } from "../../services/user/auth.service.js";

// REGISTER
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, phone } = req.body;
  const result = await authService.registerUser({ username, email, password, phone });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

// VERIFY OTP
const VerifyOtp = asyncHandler(async (req, res) => {
  const { otp, email } = req.body;
  const result = await authService.verifyOtp({ otp, email });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

// RESEND OTP
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendOtp({ email });
  return createResponse(res, result.statusCode, result.success, result.message);
});

// LOGOUT
const logOutUser = asyncHandler(async (req, res) => {
  const result = await authService.logOutUser(req.user._id);
  return createResponse(res, result.statusCode, result.success, result.message);
});

// LOGIN
const logInUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.logInUser({ email, password });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

// GOOGLE AUTH
const googleAuth = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  const result = await authService.googleAuth({ username, email });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export  {
  registerUser,
  VerifyOtp,
  resendOtp,
  logOutUser,
  logInUser,
  googleAuth,
};
