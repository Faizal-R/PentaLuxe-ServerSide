import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import Wallet from "../../models/wallet.model.js";
import { statusCodes } from "../../constants.js";

const getUserWallet = async (req, res) => {
  console.log("inside user Wallet");

  try {
    const wallet = await Wallet.findOne({ userID: req.user._id });

    if (!wallet) {
      return createResponse(
        res,
        statusCodes.OK,
        true,
        "Wallet Not Found",
        { wallet: [] }
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "user Wallet retrieved Successfully",
      { balance: wallet.balance, transactions: wallet.transactions }
    );
  } catch (error) {
    console.error("Error retrieving wallet:", error);
    return serverErrorResponse(res);
  }
};

export { getUserWallet };
