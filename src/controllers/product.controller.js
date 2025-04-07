import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.models.js";
import {
  deleteFileFromCloudinary,
  extractpublicIDFromUrl,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category, varient } = req.body;
  if (!name || !description || !price || !stock || !category || !varient) {
    throw new ApiError(400, "All Fields Are Required!");
  }
  let parsedVarient = [];
  try {
    parsedVarient = JSON.parse(req.body.varient);
  } catch (error) {
    return next(new ErrorHandler(400, "Invalid variant format. Must be JSON."));
  }

  const exsitingProduct = await Product.findOne({ name });
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
    varient: parsedVarient,
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
  console.log(req.query);
  const sortOrder = sortType === "asc" ? 1 : -1;
  const sortOption = { [sortBy]: sortOrder };

  const allProducts = await Product.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNumber);

  const totalProduct = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProduct / limitNumber);

  res.status(200).json(
    new ApiResponse(200, allProducts, "All Products fetched successfully", {
      Page: pageNumber,
      TotalProducts: totalProduct,
      TotalPages: totalPages,
    })
  );
});

const getProductById = asyncHandler(async (req, res) => {
  const productID = req.params.id;
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
  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully."));
});

const updateProduct = asyncHandler(async (req, res) => {
  const productID = req.params.id;
  const { name, description, price, stock, category, varient } = req.body;
  if (!name && !description && !price && !stock && !category && !varient) {
    throw new ApiError(400, "Atleast one field is required to update");
  }
  const product = await Product.findByIdAndUpdate(
    productID,
    {
      $set: {
        name,
        description,
        price,
        stock,
        category,
        varient,
      },
    },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, "Product not found with this ID!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully!"));
});

const uploadProductImage = asyncHandler(async (req, res) => {
  const productID = req.params.id;
  if (!productID) {
    throw new ApiError(400, "ProductID is Required!");
  }
  const product = await Product.findById(productID);
  if (!product) {
    throw new ApiError(404, "Product Not Found With This ID!");
  }
  if (
    !req.files ||
    req.file.productImages ||
    req.file.productImages.length === 0
  ) {
    throw new ApiError(400, "No Product Image is Found For Upload!");
  }
  const newImageURL = [];

  for (const file of req.files.productImages) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (uploaded?.url) {
      newImageURL.push(uploaded.url);
    }
  }
  product.images.push(...newImageURL);
  await product.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, product, "Product Image Uploaded Successfully!")
    );
});
const updateProductImage = asyncHandler(async (req, res) => {
  const productID = req.params.id;
  const retainedImages = req.body;
  if (!productID) {
    throw new ApiError(400, "ProductID is Required!");
  }
  const product = await Product.findById(productID);
  if (!product) {
    throw new ApiError(404, "Product Not Found With This ID!");
  }
  //upload images(if requested)
  const newImageURL = [];
  if (
    req.files &&
    req.files.productImages &&
    req.files.productImages.length > 0
  ) {
    for (const file of req.files.productImages) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded?.url) {
        newImageURL.push(uploaded.url);
      }
    }
  }
  //Delete Images(if requested)
  const imageToDelete = product.images.filter(
    (url) => !(retainedImages || []).includes(url)
  );
  for (const url of imageToDelete) {
    const publicID = extractpublicIDFromUrl(url);
    if (publicID) {
      await deleteFileFromCloudinary(publicID);
    }
  }
  //final list
  product.images = [...[retainedImages || [], ...newImageURL]];
  await product.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, product, "Product Images Updated Successfully!")
    );
});
const deleteProductImage = asyncHandler(async (req, res) => {
  const productID = req.params.id;
  if (!productID) {
    throw new ApiError(400, "ProductID is Required!");
  }
  const product = await Product.findById(productID);
  if (!product) {
    throw new ApiError(404, "Product Not Found With This ID!");
  }
  const imageURL = req.body.imageURL;
  if (!imageToDelete) {
    throw new ApiError(400, "Image URL is Required For Deletion!");
  }
  const publicID = extractpublicIDFromUrl(imageToDelete);
  if (publicID) {
    await deleteFileFromCloudinary(publicID);
  }
  Product.images = product.images.filter((url) => url !== imageURL);
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Product Image Deleted Sucessfully!"));
});
const deleteProduct = asyncHandler(async (req, res) => {
  const productID = req.params.id;
  if (!productID) {
    throw new ApiError(400, "ProductID is Required!");
  }
  const product = await Product.findByIdAndDelete(productID);
  if (!product) {
    throw new ApiError(404, "Product Not Found With This ID!");
  }
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Product Deleted Successfully!"));
});
export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
