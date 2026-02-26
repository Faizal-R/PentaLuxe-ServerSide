import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../../helpers/cloudinary.js";
import Category from "../../models/category.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const adminLogin = async ({ email, password }) => {
  if (!email || email.trim() === "") {
    throw new CustomError(messages.AUTH.EMAIL_REQUIRED, statusCodes.BAD_REQUEST);
  }

  if (!password || password.trim() === "") {
    throw new CustomError(messages.AUTH.PASSWORD_REQUIRED, statusCodes.BAD_REQUEST);
  }

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ email }, process.env.ADMIN_TOKEN_SECRET, {
      expiresIn: process.env.ADMIN_TOKEN_EXPIRY,
    });

    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.ADMIN.LOGIN_SUCCESS,
      data: { token },
    };
  }

  throw new CustomError(messages.AUTH.INVALID_CREDENTIALS, statusCodes.FORBIDDEN);
};

const uploadFilesAndAddCategory = async (file, categoryName) => {
  if (!file) {
    throw new CustomError(messages.ADMIN.FILE_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const category = await Category.findOne({
    categoryName: { $regex: new RegExp(categoryName, "i") },
  });

  if (category) {
    throw new CustomError(messages.ADMIN.CATEGORY_EXISTS, statusCodes.CONFLICT);
  }

  const response = await uploadOnCloudinary(file);

  const createdCategory = await Category.create({
    categoryName,
    categoryImage: response[0],
  });

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.ADMIN.FILE_UPLOAD_SUCCESS,
    data: createdCategory,
  };
};

const getCategories = async () => {
  const categories = await Category.find().sort({ createdAt: -1 });
  
  if (!categories || categories.length === 0) {
    throw new CustomError(messages.ADMIN.NO_DATA_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.RETRIEVED,
    data: categories,
  };
};

const deleteCategory = async (id) => {
  if (!id) {
    throw new CustomError(messages.COMMON.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const deletedCategory = await Category.findByIdAndDelete(id);

  if (!deletedCategory) {
    throw new CustomError(messages.ADMIN.CATEGORY_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.CATEGORY_DELETED,
    data: deletedCategory,
  };
};

const editCategory = async (file, { categoryName, categoryId }) => {
  if (!categoryName || categoryName.trim() === "") {
    throw new CustomError(messages.ADMIN.CATEGORY_NAME_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const existCategory = await Category.findOne({ categoryName, _id: { $ne: categoryId } });

  if (existCategory) {
    throw new CustomError(messages.ADMIN.CATEGORY_EXISTS, statusCodes.CONFLICT);
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new CustomError(messages.ADMIN.CATEGORY_NOT_FOUND, statusCodes.NOT_FOUND);
  }

  if (file) {
    const response = await uploadOnCloudinary(file);
    category.categoryImage = response[0];
  }

  category.categoryName = categoryName;
  await category.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.CATEGORY_UPDATED,
    data: category,
  };
};

export const adminService = {
  adminLogin,
  uploadFilesAndAddCategory,
  getCategories,
  deleteCategory,
  editCategory,
};
