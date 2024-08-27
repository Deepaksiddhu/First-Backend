import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



const videoSchema=new mongoose.Schema(
    {
        video:{
            type:String,//cloudinary url
            required:[true,"Video is required"],
        },
        thumbnail:{
            type:String,//  
            required:[true,"Thumbnail is required"],
        },
        title:{
            type:String,
            required:[true,"Title is required"],
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number,//cloudinary url
            required:true
        },
        views:{
            type:Number,
            default:0,
        },
        ispublic:{
            type:Boolean,
            default:true,
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
    timestamps:true
})


videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);