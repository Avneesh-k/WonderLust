const { model } = require("mongoose");
const Listing = require("../models/listing")
module.exports.index = async (req, res) => {
    const alllisting = await Listing.find({});
    res.render("listing/index", { alllisting });
  }

module.exports.rendernewform = (req, res) => {

    res.render("listing/new");
  }

module.exports.createnewlisting = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newlisting = new Listing(req.body.listing);
    newlisting.owner = req.user._id;
    newlisting.image = {url,filename}
    await newlisting.save();
    req.flash("success", "New Listing is added!");
    res.redirect("/listing");
  }

module.exports.showlisting =async (req, res, next) => {
    let { id } = req.params;
    const data = await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if (!data) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listing");
    }
    res.render("listing/show", { data, Api_token: process.env.Api_token });
  }


module.exports.editlisting = async (req, res) => {
  let { id } = req.params;
  const data = await Listing.findById(id);
  let originalImageUrl = data.image.url;
  originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250")
  res.render("listing/edit", { data,originalImageUrl });
}


module.exports.updatelisting = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});
  if(typeof req.file!=="undefined"){
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = {url,filename};
  await listing.save();
  }
  req.flash("success", "Listing is updated!");
  res.redirect(`/listing/${id}`);
}



module.exports.deletelisting = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing is deleted!");
  res.redirect("/listing");
}