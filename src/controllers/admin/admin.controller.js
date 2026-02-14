import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../../helpers/cloudinary.js";
import Category from "../../models/category.model.js";
import User from "../../models/user.models.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { logger } from "../../utils/logger.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import { statusCodes } from "../../constants.js";

const adminLogin = (req, res) => {
  console.log("inside the adminController");

  const { email, password } = req.body;

  if (!email || email.trim() === "") {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Email is required",
    );
  }

  if (!password || password.trim() === "") {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Password is required",
    );
  }

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ email }, process.env.ADMIN_TOKEN_SECRET, {
      expiresIn: process.env.ADMIN_TOKEN_EXPIRY,
    });

    console.log("admin Token", token);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Admin LoggedIn Successfully",
      { token },
    );
  }

  return createResponse(
    res,
    statusCodes.FORBIDDEN,
    false,
    "Invalid Email Or Password",
  );
};

const uploadFilesAndAddCategory = async (req, res) => {
  console.log("Inside the file upload function");
  console.log("req.file:", req.file);

  if (!req.file) {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "No file uploaded",
    );
  }

  const categoryName = req.body.categoryName;

  try {
    const category = await Category.findOne({
      categoryName: { $regex: new RegExp(categoryName, "i") },
    });

    if (category) {
      return createResponse(
        res,
        statusCodes.CONFLICT,
        false,
        "Category Already Exists",
      );
    }

    const response = await uploadOnCloudinary(req.file);

    const createdCategory = await Category.create({
      categoryName,
      categoryImage: response[0],
    });

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "File uploaded successfully",
      createdCategory,
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return serverErrorResponse(res);
  }
};

const getCategories = async (req, res) => {
  logger("Inside GetCategories Controller");
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    console.log(categories);
    if (!categories || categories.length === 0) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "No categories found.",
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Categories retrieved successfully.",
      categories,
    );
  } catch (error) {
    console.log(error);
    return serverErrorResponse(res);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "Category ID is required",
      );
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Category not found",
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Category deleted successfully",
      deletedCategory,
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return serverErrorResponse(res);
  }
};

const EditCategory = async (req, res) => {
  const { categoryName, categoryId } = req.body;

  console.log("req.body", req.body);
  console.log(req.file);

  if (!categoryName || categoryName.trim() === "") {
    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Category Name is Required",
    );
  }

  try {
    const existCategory = await Category.findOne({ categoryName });

    if (existCategory) {
      return createResponse(
        res,
        statusCodes.CONFLICT,
        false,
        "Category Already Exist With The Given Name",
      );
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "No Category Founded",
      );
    }

    if (req.file) {
      const response = await uploadOnCloudinary(req.file);

      console.log("inside edit categoryEdit Upload", response);

      category.categoryName = categoryName;
      category.categoryImage = response[0];

      await category.save();

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "Category Updated Successfully",
        category,
      );
    }

    category.categoryName = categoryName;
    await category.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Category Updated Successfully",
      category,
    );
  } catch (error) {
    console.log(error);
    return serverErrorResponse(res);
  }
};

export {
  adminLogin,
  uploadFilesAndAddCategory,
  getCategories,
  deleteCategory,
  EditCategory,
};
