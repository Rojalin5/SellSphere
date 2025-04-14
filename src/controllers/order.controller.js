import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { application } from "express";

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
const getMyOrders = asyncHandler(async (req, res) => {
  const userID = req.user.id;
  const orders = await Order.find({ user: userID, isDeleted: false })
    .populate("user", "name,email")
    .populate("product", "name price quantity");
  if (!orders) {
    throw new ApiError(404, "No orders found for this user.");
  }
  const totalOrders = await Order.countDocuments({
    user: userID,
    isDeleted: false,
  });
  res
    .status(200)
    .json(
      new ApiResponse(200, orders, "User Orders Fetched Successfully!", {
        totalOrders: totalOrders,
      })
    );
});
const getOrderById = asyncHandler(async (req, res) => {
  const orderID = req.params.id;
  const userID = req.user.id;
  const orders = await Order.findById(orderID)
    .populate("user", "name email")
    .populate("product", "name price quantity");
  if (!orders) {
    throw new ApiError(404, "Order Not Found!");
  }
  const totalOrders = await Order.countDocuments({ user: userID });
  res.status(200).json(
    new ApiResponse(200, orders, "Order Fetched Successfully!", {
      TotalOrders: totalOrders,
    })
  );
});
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("product", "name,price,quantity");
  if (!orders || orders.length === 0) {
    throw new ApiError(404, "Order Not Found!");
  }
  const totalOrders = await Order.countDocuments(orders);
  res.status(200).json(
    new ApiResponse(200, orders, "All Orders Fetched Successfully!", {
      TotalOrders: totalOrders,
    })
  );
});
const orderStatusUpdate = asyncHandler(async (req, res) => {
  const status = req.body.status;
  const orderID = req.params.id;
  if (!status || typeof status !== "string") {
    throw new ApiError(400, "Order status is required and must be a string");
  }
  let finalStatus = status.trim();
  finalStatus =
    finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1).toLowerCase();
  const allowedStatus = [
    "Confirmed",
    "Pending",
    "Delivered",
    "Shipped",
    "Cancelled",
  ];
  if (!allowedStatus.includes(finalStatus)) {
    throw new ApiError(400, "Invalid order status");
  }
  const order = await Order.findByIdAndUpdate(
    orderID,
    {
      $set: {
        status: finalStatus,
      },
    },
    { new: true }
  );
  if (!order) {
    throw new ApiError(404, "Order Not Found!");
  }
  res
    .status(200)
    .json(new ApiResponse(200, order, "Order Status Updated Successfully!"));
});
const cancelOrder = asyncHandler(async (req, res) => {
  const userID = req.user.id;
  const orderID = req.params.id;
  const order = await Order.findById(orderID);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (order.user.toString() !== userID.toString()) {
    throw new ApiError(403, "You are not allowed to cancel this order");
  }
  if (!["Pending", "Confirmed"].includes(order.status)) {
    throw new ApiError(
      400,
      "Only Pending or Confirmed Orders are allowed to Cancel!"
    );
  }
  if (order.status === "Cancelled") {
    throw new ApiError(400, "Order is already Cancelled!");
  }
  order.status = "Cancelled";
  await order.save();
  res
    .status(200)
    .json(new ApiResponse(200, order, "Order Cancelled Successfully!"));
});
const deleteOrder = asyncHandler(async (req, res) => {
  const orderID = req.params.id;
  const order = await Order.findById(orderID);
  if (!order) {
    throw new ApiError(404, "Order Not Found With This ID!");
  }
  if (order.isDeleted) {
    throw new ApiError(400, "Order is already deleted!");
  }
  order.isDeleted = true;
  await order.save();
  res
    .status(200)
    .json(new ApiResponse(200, null, "Order Deleted Successfully!"));
});
const restoreOrder = asyncHandler(async(req,res)=>{
    const orderID = req.params.id
    const order = await Order.findById(orderID)
    if(!order){
        throw new ApiError(404,"Order Not Found!")
    }
    if(!order.isDeleted){
        throw new ApiError(400, "Order is not deleted, so it cannot be restored!")
    }
    order.isDeleted = false
    await order.save()
    res.status(200).json(
        new ApiResponse(200,order,"Order Restored Successfully!")
    )
})
export {
  createOrder,
  getUserOrders,
  getMyOrders,
  getOrderById,
  getAllOrders,
  orderStatusUpdate,
  cancelOrder,
  deleteOrder,
  restoreOrder
};
