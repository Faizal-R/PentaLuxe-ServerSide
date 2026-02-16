import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import { statusCodes } from "../../constant/statusCodes.js";

const getAdminDashboard = async (req, res) => {
  const { filter } = req.query;

  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    console.log(currentMonth);

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
        "January","February","March","April","May","June",
        "July","August","September","October","November","December",
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

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "Yearly Sales Data Retrieved Successfully",
        { sales: MonthlySales, totalSales, totalOrders }
      );
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

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "Monthly Sales Date Retrieved Successfully",
        {
          month: currentMonth,
          year: currentYear,
          sales: DailySales,
          totalSales,
          totalOrders,
        }
      );
    }

    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Invalid filter"
    );
  } catch (error) {
    console.error(error);
    return serverErrorResponse(res, "Error fetching sales data");
  }
};

const bestSellingProducts = async (req, res) => {
  try {
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
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "No products found"
      );
    }

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Best selling products retrieved successfully",
      products
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
};

const bestSellingCategories = async (req, res) => {
  try {
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
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "No products found"
      );
    }

    console.log(categories);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Best selling products retrieved successfully",
      categories
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
};

export { getAdminDashboard, bestSellingProducts, bestSellingCategories };
