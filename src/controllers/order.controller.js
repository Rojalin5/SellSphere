import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";

const createOrder = asyncHandler(async (req, res) => {
  const { product, quantity } = req.body;
  const foundProduct = await Product.findById(product);
  if (!foundProduct) {
    throw new ApiError(404, "Product Not Found!");
  }
  const newOrder = await Order.create({
    user: req.user._id,
    product,
    quantity,
    price: foundProduct.price,
    status: "Pending",
    payment: null,
  });
  await newOrder.save();

  res
    .status(200)
    .json(new ApiResponse(200, newOrder, "Product Ordered Successfully!"));
});
const getUserOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortType = "desc",
    sortBy = "createdAt",
    query = "",
  } = req.query;
  const pageNumber = Math.max(parseInt(page));
  const limitNumber = Math.max(parseInt(limit));
  const skip = (pageNumber - 1) * limitNumber;
  const filter = {};
  if (query) {
    filter.product = { $regex: query, $options: "i" };
  }

  filter.user = req.user._id;

  const sortOrder = sortType === "asc" ? 1 : -1;
  const sortOption = { [sortBy]: sortOrder };
  const allOrders = await Order.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNumber);

  const totalOrders = await Order.countDocuments(filter);
  const totalPages = Math.ceil(totalOrders / limitNumber);
  res.status(200).json(
    new ApiResponse(200, allOrders, "All Orders Fetched Successfully.", {
      totalOrders,
      totalPages,
    })
  );
});

export { createOrder };
