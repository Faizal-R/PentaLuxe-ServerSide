import Order from "../../models/order.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const getAdminDashboard = async ({ filter }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  if (filter === "yearly") {
    const monthlySales = await Order.aggregate([
      {
        $match: {
          $and: [
            { status: { $in: ["Delivered", "Confirmed", "Shipped"] } },
            { $expr: { $eq: [{ $year: "$orderDate" }, currentYear] } },
          ],
        },
      },
      {
        $group: {
          _id: { month: { $month: "$orderDate" } },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const totalOrders = await Order.countDocuments({
      status: { $in: ["Confirmed", "Delivered", "Shipped"] },
    });

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const MonthlySales = monthNames.map((name, index) => ({
      field: name,
      sales:
        monthlySales
          .find((sale) => sale._id.month === index + 1)
          ?.totalAmount.toFixed(0) || 0,
    }));

    const totalSales = MonthlySales.reduce(
      (acc, sales) => acc + Number(sales.sales),
      0
    );

    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.ADMIN.DASHBOARD_LOADED,
      data: { sales: MonthlySales, totalSales, totalOrders },
    };
  }

  if (filter === "monthly") {
    const dailySales = await Order.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: "$orderDate" }, currentMonth] },
              { $eq: [{ $year: "$orderDate" }, currentYear] },
              { $in: ["$status", ["Delivered", "Confirmed", "Shipped"]] },
            ],
          },
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$orderDate" } },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);

    const DailySales = Array.from({ length: 31 }, (_, i) => ({
      field: `${i + 1}`,
      sales:
        dailySales
          .find((sale) => sale._id.day === i + 1)
          ?.totalAmount.toFixed(0) || 0,
    }));

    const totalSales = DailySales.reduce(
      (acc, sales) => acc + Number(sales.sales),
      0
    );

    const totalOrders = await Order.countDocuments({
      status: { $in: ["Confirmed", "Delivered", "Shipped"] },
    });

    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.ADMIN.DASHBOARD_LOADED,
      data: {
        month: currentMonth,
        year: currentYear,
        sales: DailySales,
        totalSales,
        totalOrders,
      },
    };
  }

  throw new CustomError(messages.COMMON.BAD_REQUEST, statusCodes.BAD_REQUEST);
};

const bestSellingProducts = async () => {
  const products = await Order.aggregate([
    { $match: { status: { $in: ["Delivered", "Confirmed", "Shipped"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: { productName: "$items.productName" },
        sum: { $sum: 1 },
      },
    },
    { $sort: { sum: -1 } },
  ]);

  if (products.length === 0) {
    throw new CustomError(messages.ADMIN.NO_DATA_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.DASHBOARD_LOADED,
    data: products,
  };
};

const bestSellingCategories = async () => {
  const categories = await Order.aggregate([
    { $match: { status: { $in: ["Delivered", "Confirmed", "Shipped"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: { categoryName: "$items.categoryName" },
        sum: { $sum: 1 },
      },
    },
    { $sort: { sum: -1 } },
  ]);

  if (categories.length === 0) {
    throw new CustomError(messages.ADMIN.NO_DATA_FOUND, statusCodes.NOT_FOUND);
  }

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.DASHBOARD_LOADED,
    data: categories,
  };
};

export const adminDashboardService = {
  getAdminDashboard,
  bestSellingProducts,
  bestSellingCategories,
};
