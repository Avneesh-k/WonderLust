if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}
console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedIn, saveredirectUrl, isOwner, isreviewAuthor } = require("./middleware.js");
const listingcontroller = require("./controller/listings.js");
const reviewcontroller = require("./controller/reviews.js");
const usercontroller = require("./controller/user.js");
const multer = require('multer');
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });

const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./Schema.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

const dburl = process.env.ATLASDB_URL;

main().then(() => console.log("MongoDB connected"))
     .catch(err => console.log("Connection error:", err));

async function main() {
  await mongoose.connect(dburl);
}

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const store = MongoStore.create({
  mongoUrl: dburl,
  crypto: {
    secret: process.env.SECRET
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("Error in mongo session.");
});

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
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

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
app.get("/", (req, res) => {
  res.render("listing/index.ejs");
});

// User routes
app.get("/signup", usercontroller.signupform);
app.get("/login", usercontroller.loginform);
app.post("/signup", wrapAsync(usercontroller.signup));
app.post("/login", saveredirectUrl, passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true
}), usercontroller.login);
app.get("/logout", usercontroller.logout);

// Listings routes
app.get("/listings", wrapAsync(listingcontroller.index));
app.get("/listings/new", isLoggedIn, listingcontroller.rendernewform);
app.post("/listings", isLoggedIn, upload.single("listing[image]"), wrapAsync(listingcontroller.createnewlisting));
app.get("/listings/:id", wrapAsync(listingcontroller.showlisting));
app.get("/listings/:id/edit", isLoggedIn, isOwner, wrapAsync(listingcontroller.editlisting));
app.post("/listings/:id", isLoggedIn, isOwner, upload.single("listing[image]"), wrapAsync(listingcontroller.updatelisting));
app.delete("/listings/:id/delete", isLoggedIn, isOwner, wrapAsync(listingcontroller.deletelisting));

// Review routes
app.post("/listings/:id/reviews", isLoggedIn, validateReview, wrapAsync(reviewcontroller.createReview));
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, isreviewAuthor, wrapAsync(reviewcontroller.deletereview));

// Global error handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error", { err });
});

app.listen(8080, () => {
  console.log("App is running on port 8080");
});
