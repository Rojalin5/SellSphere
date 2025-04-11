import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Cart } from "../models/cart.models.js";

const addToCart = asyncHandler(async (req, res) => {
  const { productID, quantity } = req.body;
  const userID = req.user.id;
  if (!productID || !quantity) {
    new ApiError(400, "Please Provide ProductID And Quantity.");
  }
  const existingCartItem = await Cart.findOne({
    user: userID,
    product: productID,
  });
  if (existingCartItem) {
    existingCartItem.quantity += quantity;
    await existingCartItem.save();
    return res
      .status(200)
      .json(new ApiResponse(200, existingCartProduct, "Cart updated!"));
  }
  const cartItem = await Cart.create({
    user: userID,
    product: productID,
    quantity,
  });
  res
    .status(200)
    .json(
      new ApiResponse(200, cartItem, "Product Added to Cart successfully!")
    );
});

const getCartItems = asyncHandler(async (req, res) => {
  const userID = req.user.id;
  const cartItem = await Cart.find({ user: userID }).populate("product");
  const totalItems = await Cart.countDocuments({ user: userID });
  res
    .status(200)
    .json(
      new ApiResponse(200, cartItem, "Cart Items Fetched Successfully.", {
        totalItems,
      })
    );
});

export { addToCart ,getCartItems};
