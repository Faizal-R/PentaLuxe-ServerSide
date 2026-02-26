import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { walletService } from "../../services/user/user.wallet.service.js";

const getUserWallet = asyncHandler(async (req, res) => {
  const result = await walletService.getUserWallet(req.user._id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { getUserWallet };
