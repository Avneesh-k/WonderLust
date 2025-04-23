const Listing = require("./models/listing")
const Review = require("./models/review.js");
module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You need to login first!");
        return res.redirect("/login");
      }
      next();
}


module.exports.saveredirectUrl = (req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
}


module.exports.isOwner = async(req,res,next)=>{
  const { id } = req.params;
  let listing = await Listing.findById(id);
  if(!listing.owner.equals(res.locals.currUser._id)){
    req.flash("error","You are not the owner of this listing.");
    return res.redirect(`/listing/${id}`)
  }
  next()
}


module.exports.isreviewAuthor = async(req,res,next)=>{
  const { id,reviewId } = req.params;
  let review = await Review.findById(reviewId);
  console.log(review)
  if(!review.author.equals(res.locals.currUser._id)){
    req.flash("error","You are not the author of this listing.");
    return res.redirect(`/listing/${id}`)
  }
  next()
}