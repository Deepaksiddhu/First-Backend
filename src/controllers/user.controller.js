import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";



const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh ans access tokens")
    }
}
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

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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

const loginUser = asyncHandler(async(req,res)=>
{
    //* req.body -> data
    /* username and email based login 
    find the user
    Password check
    generate access and generate token
    send cookie
    */


    //* req.body -> data
    //*username and email based login
    const {username,password,email} = req.body;
    console.log(email);
    

    if (!username && !email) {
        throw new ApiError(400,"Username or password is required");
    }

    //*find the user
    const user = await User.findOne({$or:[{username},{email}]})

    if(!user)
    {
        throw new ApiError(404,"User does not exist")
    }

    //*Password check
    const isPasswordValid =await user.isPasswordCorrect(password)

    if(!isPasswordValid)
    {
            throw new ApiError(401,"Invalid user credentials")
    }

    //*generate access and generate token
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    console.log(req.cookies?.accessToken ,  req.header("Authorization"));

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

    

})


const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

if (!incomingRefreshToken) {
    throw new ApiError(401,"Unauthorized request")
}

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401,"INVALID REFRESH TOKEN")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh Token is expired and used")
        }
    
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "INVALID REFRESH TOKEN")
    }


})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};