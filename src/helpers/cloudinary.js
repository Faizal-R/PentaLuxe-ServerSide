import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { config } from "dotenv";
config();
cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    if (!Array.isArray(localFilePath)) {
      localFilePath = [localFilePath];
    }
    console.log(localFilePath);

    // console.log("Local file path provided");

    // // Upload the file to Cloudinary
    const response = await Promise.all(
      localFilePath.map(
        async (file) =>
          await cloudinary.uploader.upload(file.path, {
            resource_type: "auto",
          })
      )
    );
    console.log("Upload response:", response);

    // File has been uploaded successfully
    return response.map((file) => file.secure_url);
  } catch (error) {
    localFilePath.forEach((file) => {
      try {
        fs.unlinkSync(file.path);
      } catch (fileError) {
        console.error("Error in file Deletion : ", error.message);
      }
    });
    return null;
  }
};

export { uploadOnCloudinary };
