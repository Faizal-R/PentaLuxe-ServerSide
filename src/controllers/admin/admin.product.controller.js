import { asyncHandler } from "../../helpers/asyncHandler.js";
import { uploadOnCloudinary } from "../../helpers/cloudinary.js";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import qs from "qs";
import { Variant } from "../../models/variant.model.js";
const uploadFilesAndAddProducts = asyncHandler(async (req, res) => {
  try {
    console.log("Received request to upload files and add product");
    const parsedBody = qs.parse(req.body);
    const {
      Name,
      categoryName,
      ScentType,
      Description,
      Gender,
      DiscountPercentage,
      productVolumes,
    } = parsedBody;
  // console.log("inside the admin add product ",parsedBody);
  //   console.log("inside the produt admin",productVolumes);

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }
    // Upload files to Cloudinary
    const response = await uploadOnCloudinary(req.files);

    if (!response || response.length === 0) {
      return res
        .status(500)
        .json({ success: false, message: "File upload failed" });
    }
    // Find the category
    const category = await Category.findOne({ categoryName });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category Not Found" });
    }
    const product = await Product.create({
      Name,
      Description,
      Gender,
      isBlocked: false,
      ScentType,
      Images: response,
      DiscountPercentage,
      CategoryId: category._id,
    });

    // Step 2: Prepare Variants Data
    const productVolumesArray = Object.entries(productVolumes).map(
      ([key, value]) => ({
        productId: product._id,
        volume: key,
        price: Number(value.price),
        stock: Number(value.stock),
      })
    );

    const createdVariants = await Variant.create(productVolumesArray);
    await Product.updateOne(
      { _id: product._id },
      { $set: { Variants: createdVariants.map((variant) => variant._id) } }
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: product,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("CategoryId")
      .populate("Variants")
      .sort({ createdAt: -1 });
    const filteredProducts = products.filter(
      (product) => product.CategoryId !== null
    );
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products: filteredProducts,
    });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("adminId", id);
  // Check if the id is present
  if (!id) {
    return res.status(404).json({
      success: false,
      message: "Product ID is required",
    });
  }

  // Attempt to find and delete the product
  const deletedProduct = await Product.findByIdAndDelete(id);

  if (!deletedProduct) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    deletedProduct,
  });
});

const singleProudct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({
      success: false,
      message: "Product ID is Not provided",
    });
  }
  const product = await Product.findById({ _id: id })
    .populate("CategoryId")
    .populate("Variants");
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "No Product is Founded With Provided Id",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Product fetched Successfully",
    product,
  });
});

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      Name,
      Gender,
      categoryName,
      DiscountPercentage,
      Description,
      ScentType,
    } = req.body;
    const Quantities = JSON.parse(req.body.Quantities);
    const existingImages = JSON.parse(req.body.existingImages);
    console.log(req.file)
  if(req.file){

    const response = await uploadOnCloudinary(req.file);
    if (!response || response.length === 0) {
      return res
        .status(500)
        .json({ success: false, message: "File upload failed" });
    }
    if(response){
     existingImages.push(response[0])
    }
  }
    const category=await Category.findOne({categoryName})
    const product = await Product.findById(id).populate("Variants");
    const updatePromises = [];
    // Iterate through each quantity9
    for (const quantity of Quantities) {
      if (quantity._id) {
        // If the quantity has an ID, update the existing variant
        const updatePromise = Variant.findByIdAndUpdate(
          quantity._id,
          {
            volume: quantity.volume,
            price: quantity.price,
            stock: quantity.stock,
          },
          { new: true } // This option returns the updated document
        );
        updatePromises.push(updatePromise);
      } else {
        // If the quantity does not have an ID, create a new variant
        const newVariantPromise = Variant.create({
          productId: id,
          volume: quantity.volume,
          price: quantity.price,
          stock: quantity.stock,
        });
        updatePromises.push(newVariantPromise);
      }
    }

    // Wait for all variant updates/creations to complete
    const updatedVariants = await Promise.all(updatePromises);

    product.Name = Name;
    product.Gender = Gender;
    product.CategoryId = category._id;
    product.DiscountPercentage = DiscountPercentage;
    product.Description = Description;
    product.ScentType = ScentType;
    product.Images = existingImages;
    product.Variants = updatedVariants.map((variant) => variant._id); // Update Quantities here

    // Save the updated product document
    await product.save();

    console.log("updatedProduct", product);
   
    return res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const searchProducts = async (req, res) => {
  const { text } = req.body;
  console.log(text);

  if (!text) {
    return res.status(400).json({
      message: "No text provided.",
      success: false,
    });
  }

  try {
    const products = await Product.find({
      Name: new RegExp(text, "i"),
    }).populate("CategoryId");
    console.log(products);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products found.",
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export {
  uploadFilesAndAddProducts,
  getAllProducts,
  deleteProduct,
  singleProudct,
  updateProduct,
  searchProducts,
};
