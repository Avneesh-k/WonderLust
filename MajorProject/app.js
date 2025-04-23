// Required modules
if(process.env.NODE_ENV !="production"){
  require('dotenv').config();
}
console.log(process.env.SECRET)
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo')
const flash = require("connect-flash");
const passport = require("passport")
const LocalStrategy = require("passport-local")
const User = require("./models/user.js")
const {isLoggedIn, saveredirectUrl,isOwner,isreviewAuthor} = require("./middleware.js")
const listingcontroller = require("./controller/listings.js")
const reviewcontroller = require("./controller/reviews.js")
const usercontroller = require("./controller//user.js")
const multer = require('multer')
const {storage} = require("./cloudConfig.js")
const upload = multer({storage})
// Utility and schema imports
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./Schema.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

const dburl = process.env.ATLASDB_URL
// Database connection
main().then(() => console.log("MongoDB connected"))
     .catch(err => console.log("Connection error:", err));

async function main() {
  await mongoose.connect(dburl);
}

// App configurations
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const store =MongoStore.create({
  mongoUrl:dburl,
  crypto:{
    secret:process.env.SECRET
  },
  touchAfter:24*3600,
})

store.on("error",()=>{
  console.log("Error in mongo session.")
})
// Session and flash config
const sessionOption = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1 * 60 * 1000,
    maxAge: 1 * 60 * 1000,
    httpOnly: true,
  },
};



app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());//use for session we do need to login for individual page browser know as a single session.
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());//used by passport to serialize users into the session
passport.deserializeUser(User.deserializeUser());//used by passport to deserialize users into the session.


// Middleware to pass flash messages to all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user
  next();
});

// Middleware to validate reviews
const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// Routes
// app.get("/", (req, res) => {
//   res.send("This is the root page.");
// });


//get request for getting the signup form
app.get("/signup",usercontroller.signupform)


//get request for login page.
app.get("/login",usercontroller.loginform)
//post request for save the data of the user in the database.
app.post("/signup",wrapAsync(usercontroller.signup));


//post request for login the user.
app.post("/login",saveredirectUrl,passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),usercontroller.login)


//get request for logout the user.
app.get("/logout",usercontroller.logout)



// Index Route
app.get("/listing", wrapAsync(listingcontroller.index));

// New Listing Form
app.get("/listing/new",isLoggedIn, listingcontroller.rendernewform);

// Create New Listing
app.post("/listings",isLoggedIn,upload.single("listing[image]"),wrapAsync(listingcontroller.createnewlisting));


// Show Listing
app.get("/listing/:id", wrapAsync(listingcontroller.showlisting));

// Edit Listing Form
app.get("/listings/:id/edit", isLoggedIn,isOwner,wrapAsync(listingcontroller.editlisting));

// Update Listing
app.post("/listings/:id", isLoggedIn,isOwner,upload.single("listing[image]"),wrapAsync(listingcontroller.updatelisting));

// Delete Listing
app.delete("/listings/:id/delete",isLoggedIn,isOwner, wrapAsync(listingcontroller.deletelisting));

// Create Review
app.post("/listings/:id/reviews",isLoggedIn, validateReview, wrapAsync(reviewcontroller.createReview));

// Delete Review
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn,isreviewAuthor,wrapAsync(reviewcontroller.deletereview));
 
// 404 Handler
// app.all("*", (req, res, next) => {
//   next(new ExpressError(404, "Page not found"));
// });

// Global Error Handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error", { err });
});

// Server start
app.listen(8080, () => {
  console.log("App is running on port 8080");
});
