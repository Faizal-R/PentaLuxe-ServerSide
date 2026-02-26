import Wallet from "../../models/wallet.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";

const getUserWallet = async (userId) => {
  const wallet = await Wallet.findOne({ userID: userId });

  if (!wallet) {
    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.WALLET.NOT_FOUND,
      data: { wallet: [] },
    };
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.WALLET.RETRIEVED,
    data: { balance: wallet.balance, transactions: wallet.transactions },
  };
};

export const walletService = {
  getUserWallet,
};
