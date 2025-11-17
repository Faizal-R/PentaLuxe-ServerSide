import mongoose from "mongoose";

const walletSchema = mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        orderID: {
          type: String,

          required: true,
        },
        amount: {
          type: Number,
        },
        method: {
          type: String,
        },
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
  },
  {
    timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
