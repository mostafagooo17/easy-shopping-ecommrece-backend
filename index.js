const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('upload'));
const cors = require("cors");
app.use(cors());
const auth = require("./routes/Auth");
const brands = require("./routes/Brands");
const category = require("./routes/Category");
const subcategory = require("./routes/subcategory");
const products = require("./routes/Products");
const shopingcarts = require("./routes/Shoppingcarts");
const orders = require("./routes/Orders");

app.listen(4000, "localhost", () => {
    console.log("SERVER IS RUNNING");

});
app.use("/auth", auth);
app.use("/brands", brands);
app.use("/category", category);
app.use("/subcategory", subcategory);
app.use("/products", products);
app.use("/shopingcarts", shopingcarts);
app.use("/orders", orders);




