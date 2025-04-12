import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Order} from "../models/order.models.js"
import { Product } from "../models/product.models.js";

const createOrder = asyncHandler(async(req,res)=>{
    const {product,quantity} = req.body
const foundProduct = await Product.findById(product)
if(!foundProduct){
    throw new ApiError(404,"Product Not Found!")
}
const newOrder = await Order.create({
    user:req.user._id,
    product,
    quantity,
    price:foundProduct.price,
    status:"Pending",
    payment:null
})
 await newOrder.save()

 res.status(200).json(
    new ApiResponse(200,newOrder,"Product Ordered Successfully!")
 )
}) 

export {createOrder}