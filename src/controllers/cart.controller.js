import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Cart } from "../models/cart.models.js";

const addToCart = asyncHandler(async (req, res) => {
  const { productID, quantity, size, color } = req.body;
  const userID = req.user.id;
  if (!productID || !quantity) {
    new ApiError(400, "Please Provide ProductID And Quantity.");
  }
  const existingCartItem = await Cart.findOne({
    user: userID,
    product: productID,
    size,
    color,
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
    size,
    color,
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
  res.status(200).json(
    new ApiResponse(200, cartItem, "Cart Items Fetched Successfully.", {
      totalItems,
    })
  );
});
const updateCartItem = asyncHandler(async (req, res) => {
  const { cartItemID,product,quantity, size, color } = req.body;
  const userID = req.user.id;
  if (!cartItemID) {
    throw new ApiError(400, "Please Provide Cart Item ID");
  }
  const cartItem = await Cart.findOne({ _id: cartItemID, user: userID });
  if (!cartItem) {
    throw new ApiError(404, "cart Not Found!");
  }
  const duplicateCartItem = await Cart.findOne({
    _id: { $ne: cartItemID },
    user: userID,
    product: cartItem.product,
    size: size || null,
    color: color || null,
  });
  if (duplicateCartItem) {
    throw new ApiError(400, "Product with same variant already exists in cart");
  }
  if (quantity !== undefined) cartItem.quantity = quantity;
  if (size !== undefined) cartItem.size = size;
  if (color !== undefined) cartItem.color = color;
if(product !== undefined) cartItem.product = product
  await cartItem.save();
  res
    .status(200)
    .json(new ApiResponse(200, cartItem, "Cart Item Updated Successfully!"));
});

const deleteCartItem = asyncHandler(async(req,res)=>{
    const cartItemID = req.params.id
    const userID=req.user.id
    if(!cartItemID){
        throw new ApiError(400,"Please Provide Cart Item ID.")
    }
    const cartItem = await Cart.findOneAndDelete({_id:cartItemID,user:userID})
    if(!cartItem){
        throw new ApiError(404,"Cart Item Not Found!")
    }
    res.status(200).json(
        new ApiResponse(200,{},"Cart Item Removed Successfylly!")
    )
})
const clearCart = asyncHandler(async(req,res)=>{
    const userID = req.user.id
    const cartItems = await Cart.find({user:userID})
        if(cartItems.length === 0){
throw new ApiError(404,"Your Cart is Already Empty!")
        }
await Cart.deleteMany({user:userID})
res.status(200).json(
    new ApiResponse(200,{},"Cart Cleared Successfully")
)
})

export { addToCart, getCartItems ,updateCartItem,deleteCartItem,clearCart};
