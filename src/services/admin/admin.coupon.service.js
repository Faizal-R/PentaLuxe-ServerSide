import Coupon from "../../models/coupon.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const createCoupon = async (couponData) => {
  const {
    couponName,
    discountPercentage,
    maxDiscountPrice,
    minimumPurchasePrice,
    expiryDate,
  } = couponData;

  if (
    !couponName ||
    !discountPercentage ||
    !maxDiscountPrice ||
    !minimumPurchasePrice ||
    !expiryDate
  ) {
    throw new CustomError(messages.COUPON.REQUIRED_FIELDS, statusCodes.BAD_REQUEST);
  }

  const existingCoupon = await Coupon.findOne({ couponName });

  if (existingCoupon) {
    throw new CustomError(messages.COUPON.EXISTS, statusCodes.CONFLICT);
  }

  const newCoupon = await Coupon.create({
    couponName,
    discountPercentage,
    maxDiscountPrice,
    minimumPurchasePrice,
    expiryDate,
  });

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.COUPON.CREATED,
    data: newCoupon,
  };
};

const deleteCoupon = async (id) => {
  if (!id) {
    throw new CustomError(messages.COMMON.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    throw new CustomError(messages.COUPON.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.COUPON.DELETED,
  };
};

const getAllCoupons = async () => {
  const coupons = await Coupon.find({});

  const updatedCoupons = await Promise.all(
    coupons.map(async (coupon) => {
      try {
        const expiryDate = new Date(coupon.expiryDate);

        if (Date.now() > expiryDate.getTime()) {
          coupon.expiryDate = null;
          await coupon.save();
          return coupon;
        }

        return coupon;
      } catch (error) {
        console.log("coupon error", error);
        return coupon;
      }
    })
  );

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.COUPON.RETRIEVED,
    data: updatedCoupons,
  };
};

export const couponService = {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
};
