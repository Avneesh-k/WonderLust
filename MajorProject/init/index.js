const mongoose = require('mongoose');
const initData = require("./data.js")
const Listing = require("../models/listing.js")
main()
      .then(()=>{
        console.log("Connection is stablish.")
      })
      .catch((err)=>
        console.log(err))
      
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wonderlust") //connect is an asynchronous function so need to use async and await for this.
}

const initDB = async()=>{
    await Listing.deleteMany({})
    initData.data = initData.data.map((obj)=>({...obj,owner:"6802ce1ef6aef4b4df8c59d7",}))
    await Listing.insertMany(initData.data)
    console.log("Data is initialize")
}

initDB()