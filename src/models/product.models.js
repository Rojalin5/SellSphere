import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    category: {
      type: Number,
      required: true,
    },
    tags:[String],
    images:[{type:String}],
    varient:[{size:String,color:String,price:Number}]
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product",productSchema)
