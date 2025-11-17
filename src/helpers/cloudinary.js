import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dhbwlpe6i",
  api_key: "837782626763286",
  api_secret: "-Nkm3c9Vb6Hzy-L7q-ksX3rosPM",
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
