import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Product } from "../models/product.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category, varient } = req.body;
  if (!name || !description || !price || !stock || !category || !varient) {
    throw new ApiError(400, "All Fields Are Required!");
  }
  if (req.user.role !== "Admin") {
    throw new ApiError(401, "You are not authorized to create a product!");
  }
  const exsitingProduct = await Product.findOne({
    name: { $regex: new RegExp("^${name}$", "i") },
  });
  if (exsitingProduct) {
    throw new ApiError(400, "Product with this name already exists.");
  }
  let productPicture = [];
  if (
    req.files &&
    Array.isArray(req.files.productImages) &&
    req.files.productImages.length > 0
  ) {
    for (const file of req.files.productImages) {
      const productImageLocalPath = file.path;
      const productImages = await uploadOnCloudinary(productImageLocalPath);
      if (productImages) {
        productPicture.push(productImages.url);
      }
    }
  }
  let productTags = [];
  if (req.body.tags) {
    if (Array.isArray(req.body.tags)) {
      productTags = req.body.tags.map((tag) => tag.trim());
    } else {
      productTags = req.body.tags.split(",").map((tag) => tag.trim());
    }
  }
  const product = await Product.create({
    name,
    description,
    price,
    stock,
    category,
    tag: productTags,
    varient,
    images: productPicture,
    owner: req.user._id,
  });
  res
    .status(201)
    .json(new ApiResponse(201, product, "Product Added Successfully!"));
});
