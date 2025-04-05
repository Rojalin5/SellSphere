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

const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortType, sortBy, AdminID } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  if (query) {
    filter.name = { $regex: query, $options: "i" };
  }
  if (AdminID) {
    filter.owner = AdminID;
  }
  const sortOrder = sortType === "asc" ? 1 : -1;
  const sortOption = { [sortBy]: sortOrder };

  const allProducts = await Product.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNumber);

  const totalProduct = await Product.countDocuments(filter);
  const totalPages = Math.ceil(TotalProducts / limitNumber);

  res.status(200).json(
    new ApiResponse(200, allProducts, "All Products fetched successfully", {
      Page: pageNumber,
      TotalProducts: totalProduct,
      TotalPages: totalPages,
    })
  );
});

const getProductById = asyncHandler(async (req, res) => {
  const productID = req.params._id;
  if (!productID) {
    throw new ApiError(400, "ProductID is Required!");
  }
  const product = await Product.findById(productID).populate(
    "owner",
    "-password -refreshToken"
  );
  if (!product) {
    throw new ApiError(404, "Product not found!");
  }
  res.status(200).json(
    new ApiResponse(200,product,"Product fetched successfully.")
  )
});
export { createProduct, getAllProducts,getProductById };
