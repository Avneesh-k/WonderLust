const mongoose = require("mongoose")
const Schema = mongoose.Schema
const Review = require("./review.js")
const listingSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    description:String,
    image:{
       url:String,
       filename:String,
    },
    price:Number,
    location: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
              return /^[a-zA-Z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid location!`
          }
    },
    country: {
        type: String,
        required: true
    },
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
    owner :{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
})

listingSchema.post("findOneAndDelete",async(Listing)=>{
    if(Listing){
        await Review.deleteMany({_id:{$in:Listing.reviews}})
    }
})

const Listing = mongoose.model("Listing",listingSchema)
module.exports = Listing
