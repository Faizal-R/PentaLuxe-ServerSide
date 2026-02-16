import Coupon from "../../models/coupon.model.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import { statusCodes } from "../../constant/statusCodes.js";

const createCoupon = async (req, res) => {
  console.log(req.body);

  try {
    const {
      couponData: {
        couponName,
        discountPercentage,
        maxDiscountPrice,
        minimumPurchasePrice,
        expiryDate,
      },
    } = req.body;

    console.log(couponName, discountPercentage, maxDiscountPrice);

    if (
      !couponName ||
      !discountPercentage ||
      !maxDiscountPrice ||
      !minimumPurchasePrice ||
      !expiryDate
    ) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "All fields are required."
      );
    }

    const existingCoupon = await Coupon.findOne({ couponName });

    if (existingCoupon) {
      return createResponse(
        res,
        statusCodes.CONFLICT,
        false,
        "Coupon with this name already exists."
      );
    }

    const newCoupon = await Coupon.create({
      couponName,
      discountPercentage,
      maxDiscountPrice,
      minimumPurchasePrice,
      expiryDate,
    });

    console.log(newCoupon);

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "Coupon created successfully.",
      newCoupon
    );
  } catch (error) {
    console.error(error.message);
    return serverErrorResponse(res);
  }
};

const editCoupon = async (req, res) => {};

const deleteCoupon = async (req, res) => {
  const id = req.params.id;

  try {
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "No Coupon is Founded with The Provided Id"
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Coupon Removed Successfully"
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
};

const getAllCoupons = async (req, res) => {
  console.log("inside the coupons");

  try {
    const coupons = await Coupon.find({});

    const updatedCoupons = await Promise.all(
      coupons.map(async (coupon) => {
        try {
          const expiryDate = new Date(coupon.expiryDate);

          if (Date.now() > expiryDate.getTime()) {
            coupon.expiryDate = null;
            await coupon.save();
            console.log(coupon);
            return coupon;
          }

          return coupon;
        } catch (error) {
          console.log("coupon error", error);
          return coupon;
        }
      })
    );

    console.log(updatedCoupons);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Coupons retrieved successfully.",
      updatedCoupons
    );
  } catch (error) {
    console.log(error);
    return serverErrorResponse(res, "Failed to fetch coupon codes");
  }
};

export { createCoupon, deleteCoupon, editCoupon, getAllCoupons };
