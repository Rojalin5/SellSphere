import mongoose from "mongoose";
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
  const {
    page = 1,
    limit = 10,
    query = "",
    sortType = "desc",
    sortBy = "createdAt",
  } = req.query;
  const pageNumber = Math.max(parseInt(page));
  const limitNumber = Math.max(parseInt(limit));
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  if (query) {
    filter.name = { $regex: query, $options: "i" };
  }
  //authenticated admin's ID
  filter.owner = req.user._id;

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
  if (!mongoose.Types.ObjectId.isValid(productID)) {
    throw new ApiError(400, "ProductID is not Valid!");
  }
  const { name, description, price, tags, stock, category, varient } = req.body;
  if (
    !name &&
    !description &&
    !price &&
    !tags &&
    !stock &&
    !category &&
    !varient
  ) {
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
        tags,
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
    !req.files.productImages ||
    req.files.productImages.length === 0
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
  const retainedImages = JSON.parse(req.body.retainedImages || "[]");
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
  product.images = [...retainedImages, ...newImageURL];
  console.log("Images to delete:", imageToDelete);
  console.log("Retained Images:", retainedImages);
  console.log("New Images:", newImageURL);
  console.log("Final Image List:", [...retainedImages, ...newImageURL]);

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
  if (!imageURL) {
    throw new ApiError(400, "Image URL is Required For Deletion!");
  }
  const publicID = extractpublicIDFromUrl(imageURL);
  if (publicID) {
    await deleteFileFromCloudinary(publicID);
  }
  product.images = product.images.filter((url) => url !== imageURL);
  await product.save();
  res
    .status(200)
    .json(new ApiResponse(200, product, "Product Image Deleted Sucessfully!"));
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
const filterProductBySearch = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice } = req.query;
  const query = { $and: [] };
  if (keyword) {
    query.$and.push({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    });
  }
  if (category) {
    query.$and.push({ category });
  }

  if (maxPrice || minPrice) {
    const priceFilter = {};
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    if (minPrice) priceFilter.$gte = Number(minPrice);

    query.$and.push({ price: priceFilter });
  }
  const finalQuery = query.$and.length > 0 ? query : {};
  const products = await Product.find(finalQuery);
  const count = await Product.countDocuments(finalQuery);
  res
    .status(200)
    .json(
      new ApiResponse(200, products, "Product Fetched Successfully!", {
        "Number of Product": count,
      })
    );
});
const getProductByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  if (!category) {
    throw new ApiError(400, "Category is Required!");
  }
  const products = await Product.find({ category }).sort({ createdAt: -1 });
  const count = await Product.countDocuments({ category });
  res
    .status(200)
    .json(
      new ApiResponse(200, products, "Products fetched successfully!", {
        "Number of Product": count,
      })
    );
});
const getReleatedProducts = asyncHandler(async (req, res) => {
  const productID = req.params.id;
  if (!productID) {
    throw new ApiError(400, "ProductID is Required!");
  }
  const currentProduct = await Product.findById(productID);
  if (!currentProduct) {
    throw new ApiError(404, "Product Not Found With This ID!");
  }
  const releatedProduct = await Product.find({
    _id: { $ne: productID },
    category: currentProduct.category,
  }).limit(20);
  if (releatedProduct.length === 0) {
    throw new ApiError(404, "No Releated Product Found!");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        releatedProduct,
        "Releated Products Fetched Successfully!"
      )
    );
});
const getLatestProducts = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const latestProducts = await Product.find()
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        latestProducts,
        "Latest Products fetched successfully"
      )
    );
});
const batchUploadProduct = asyncHandler(async (req, res) => {
  const products = req.body.products;
  if (!Array.isArray(products) || products.length === 0) {
    throw new ApiError(400, "Please provide an array of products to upload.");
  }
  const adminID = req.user?._id;
  const productWithOwner = products.map((product) => ({
    ...product,
    owner: adminID,
  }));
  try {
    const insertedProduct = await Product.insertMany(productWithOwner, {
      ordered: false,
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          insertedProduct,
          `${insertedProduct.length} products uploaded successfully`
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while uploading products.");
  }
});
const batchDeleteProducts = asyncHandler(async (req, res) => {
  const productIDs = req.body.productIDs;
  if (!productIDs || !Array.isArray(productIDs) || productIDs.length === 0) {
    throw new ApiError(400, "Please Provide ProductIDs.");
  }
  const deletedProducts = await Product.deleteMany({
    _id: { $in: productIDs },
  });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedProducts,
        `${deletedProducts.deletedCount} Products Deleted Successfully`
      )
    );
});
export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
  deleteProduct,
  filterProductBySearch,
  getProductByCategory,
  getReleatedProducts,
  getLatestProducts,
  batchUploadProduct,
  batchDeleteProducts,
};
