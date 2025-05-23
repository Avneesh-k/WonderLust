const User = require("../models/user")
module.exports.signupform = (req,res)=>{
    res.render("users/signup.ejs");
  }


module.exports.signup = async(req,res)=>{
  try{
    let {username,email,password} = req.body;
    const newUser = new User({email,username});
    const registereduser = await User.register(newUser,password);
    req.login(registereduser,(err)=>{
      if(err){
        return next(err)
      }
      req.flash("success","Welcome to wonder lust!");
      res.redirect("/listings");
    })

  }catch(err){
    req.flash("error",err.message);
    res.redirect("/signup");
  }

}


module.exports.loginform = (req,res)=>{
    res.render("users/login.ejs")
  }


module.exports.login = async(req,res)=>{
    req.flash("success","Welcome to wonderbacklust.")
    let redirecturl = res.locals.redirectUrl || "/listings"
    res.redirect(redirecturl)
 }


module.exports.logout = (req,res,next)=>{
    req.logOut((err)=>{
      if(err){
        return next(err)
      }
      req.flash("success","You are logged out!")
      res.redirect("/listings")
    })
}