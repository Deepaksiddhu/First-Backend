import { v2 as cloudinary } from "cloudinary";
import fs from "fs";




    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET 
    });

    

    const uploadOnCloudinary = async (localFilePath) => {
        try {
            if (!localFilePath) return null;
            //upload the file on Cloudinary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto",
            });
            //file uploaded successfully
            console.log("File uploaded successfully and int the response all these are :=>",response);
            console.log("File uploaded successfully",response.url);
            return response;
            
        } catch (error) {
            fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the uploaded operation got failed
        }
    }

    export {uploadOnCloudinary}