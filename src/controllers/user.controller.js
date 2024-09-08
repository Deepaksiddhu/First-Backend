import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
export {ApiResponse} from '../utils/ApiResponse.js';


const registerUser = asyncHandler(async(req,res) => {
    // console.log(req.files);
    // res.status(200).json({
    //     message:"ok"
    // })

    //*get user details from frontend
    //* Validation - not empty,( email, password, confirm password)
    //* check if user already exists : email,username
    //* Check for images , check for avatar
    //* Upload them to cloudinary ,avatar
    //* Create user Object - create entry in DB
    //* remove password and refresh token field from response
    //* check for user creation  -> if(yes )= return resp otherwise return error



    //get user details from frontend
    const {fullName,email,password,username}=req.body;
    // console.log(email,password);
    // console.log(req.body);
    
    

    if (
        [fullName,email,password,username].some((field) =>
        field?.trim() ==="")
    ) {
        throw new ApiError(400,"All Fields are required");
    }


    // Validation - not empty,( email, password, confirm password)
    const existedUser = await User.findOne({
        $or:[{ username },{ email }]
    })
    // console.log(existedUser);
    

    if(existedUser)
    {
        throw new ApiError(409,"User with this email or username already exists");
    }


    // Check for images , check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath ;

    if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }




    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required");
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered successfully")
    )

})


export {registerUser};