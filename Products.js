const router = require("express").Router();
const conn = require("../db/dbconnection");
const authhorized = require("../middelware/authraize");
const admin = require("../middelware/admin");
const { body, validationResult } = require('express-validator');
const upload = require("../middelware/upload");
const util = require("util");
const fs = require("fs");

//Admin add products
router.post("", admin, upload.fields([{ name: 'image_gallery', maxCount: 4 }, { name: 'image_cover', maxCount: 1 }]),
    body("name").isString().withMessage("please enter vaild product name").isLength({ min: 3 }).withMessage("product name shoud be at lease 3 characters"),
    body("description").isString().withMessage("please enter vaild product description").isLength({ min: 20 }).withMessage("product description shoud be at lease 20 characters"),
    body("colors").isString().withMessage("please enter vaild product colors").isLength({ min: 10 }).withMessage("product colors shoud be at lease 10 characters"),
    body("type").isString().withMessage("please enter vaild product type").isLength({ min: 3 }).withMessage("product type shoud be at lease 3 characters"),
    body("category_id").isInt().withMessage("please enter valid category_id"),
    body("subcategory_id").isInt().withMessage("please enter valid subcategory_id"),
    body("brand_id").isInt().withMessage("please enter valid brand_id"),
    body("price").isDecimal().withMessage("please enter vaild product price"),
    body("discount").isDecimal().withMessage("please enter vaild product discount").isLength({ min: 0, max: 100 }).withMessage("product discount shoud be at lease 0% to 100%"),
    body("average_rating").isDecimal().withMessage("please enter vaild product average_rating"),
    body("quantity_available").isInt().withMessage("please enter vaild product quantity"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //valdate file
            if (!req.files || !req.files.image_gallery || !req.files.image_cover) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: " images is required",
                        },
                    ],
                });
            }
            const imageGalleryArray = req.files.image_gallery.map(file => file.filename);
            const final_price = (req.body.price) - ((req.body.price) * (req.body.discount) / 100);
            //preper product object
            const product = {
                name: req.body.name,
                description: req.body.description,
                image_gallery: JSON.stringify(imageGalleryArray),
                image_cover: req.files.image_cover[0].filename,
                colors: req.body.colors,
                type: req.body.type,
                category_id: req.body.category_id,
                subcategory_id: req.body.subcategory_id,
                brand_id: req.body.brand_id,
                price: req.body.price,
                discount: req.body.discount,
                average_rating: req.body.average_rating,
                quantity_available: req.body.quantity_available,
                price_after_discount: final_price,
            };

            const query = util.promisify(conn.query).bind(conn);
            await query("INSERT INTO products SET ?", product);
            res.status(200).json({
                msg: "product created successfuly",
            });
        } catch (err) {
            res.status(500).json(err);
        }
    });

//Admin Update product
router.put("/:id", upload.fields([{ name: 'image_gallery', maxCount: 4 }, { name: 'image_cover', maxCount: 1 }]),
    body("name").isString().withMessage("please enter vaild product name").isLength({ min: 3 }).withMessage("product name shoud be at lease 3 characters"),
    body("description").isString().withMessage("please enter vaild product description").isLength({ min: 20 }).withMessage("product description shoud be at lease 20 characters"),
    body("colors").isString().withMessage("please enter vaild product colors").isLength({ min: 10 }).withMessage("product colors shoud be at lease 10 characters"),
    body("type").isString().withMessage("please enter vaild product type").isLength({ min: 3 }).withMessage("product type shoud be at lease 3 characters"),
    body("category_id").isInt().withMessage("please enter valid category_id"),
    body("subcategory_id").isInt().withMessage("please enter valid subcategory_id"),
    body("brand_id").isInt().withMessage("please enter valid brand_id"),
    body("price").isDecimal().withMessage("please enter vaild product price"),
    body("discount").isDecimal().withMessage("please enter vaild product discount").isLength({ min: 0, max: 100 }).withMessage("product discount shoud be at lease 0% to 100%"),
    body("average_rating").isDecimal().withMessage("please enter vaild product average_rating"),
    body("quantity_available").isInt().withMessage("please enter vaild product quantity"),
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //book is exit or not
            const product = await query("SELECT * from products WHERE id = ?", [req.params.id]);
            if (!product[0]) {
                res.status(404).json({ msg: "product not found !" });
            }
            const imageGalleryArray = req.files.image_gallery.map(file => file.filename);
            const final_price = (req.body.price) - ((req.body.price) * (req.body.discount) / 100);
            //preper book object
            const productobj = {
                name: req.body.name,
                description: req.body.description,
                image_gallery: JSON.stringify(imageGalleryArray),
                image_cover: req.files.image_cover[0].filename,
                colors: req.body.colors,
                type: req.body.type,
                category_id: req.body.category_id,
                subcategory_id: req.body.subcategory_id,
                brand_id: req.body.brand_id,
                price: req.body.price,
                discount: req.body.discount,
                average_rating: req.body.average_rating,
                quantity_available: req.body.quantity_available,
                price_after_discount: final_price,
            };
            if (!req.file) {
                fs.unlinkSync("./upload/" + product[0].image_cover);
                // Get the array of image filenames from the product object
                const imageFilenames = product[0].image_gallery.split(",");
                const imageGalleryArray = JSON.parse(imageFilenames);
                // Loop through the array of image filenames and delete each file using the `fs.unlinkSync()` function
                for (const imageFilename of imageGalleryArray) {
                    fs.unlinkSync("./upload/" + imageFilename);
                }
            }

            await query("UPDATE products SET ? WHERE id = ?", [productobj, product[0].id]);

            res.status(200).json({
                msg: "product updated successfuly",
            });
        } catch (err) {
            res.status(500).json(err);
        }
    });
//Admin Delete products
router.delete("/:id", admin,
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //check exit book or not
            const product = await query("SELECT * from products WHERE id = ?", [req.params.id]);
            if (!product[0]) {
                res.status(404).json({ msg: "product not found !" });
            }
            //preper book object
            else {

                fs.unlinkSync("./upload/" + product[0].image_cover);
                // Get the array of image filenames from the product object
                const imageFilenames = product[0].image_gallery.split(",");
                const imageGalleryArray = JSON.parse(imageFilenames);
                // Loop through the array of image filenames and delete each file using the `fs.unlinkSync()` function
                for (const imageFilename of imageGalleryArray) {
                    fs.unlinkSync("./upload/" + imageFilename);
                }
                await query("DELETE FROM products  WHERE id = ?", [product[0].id]);
                res.status(200).json({
                    msg: "product is delete sucessfully !",
                });
            }

        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    });
// Admin list products
router.get("", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const products = await query("SELECT p.*, c.name as category_name, b.name as brand_name, s.name as subcategory_name FROM products p INNER JOIN categories c ON p.category_id = c.id INNER JOIN brands b ON p.brand_id = b.id INNER JOIN subcategories s ON p.subcategory_id = s.id");
    // Modify the response
    const baseUrl = `http://${req.hostname}:4000/`;

    products.forEach((product) => {
        product.image_cover = `http://${req.hostname}:4000/${product.image_cover}`;
        const imageFilenames = product.image_gallery.split(",");
        product.image_gallery = JSON.parse(imageFilenames);

        if (Array.isArray(product.image_gallery)) {
            product.image_gallery = product.image_gallery.map(image => `${baseUrl}${image}`);
        }
    });

    res.status(200).json(products);
});

//show product details
router.get("/:id", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const baseUrl = `http://${req.hostname}:4000/`;
    const products = await query("SELECT * FROM products WHERE id =?", [req.params.id]);
    if (!products[0]) {
        res.status(404).json({ msg: "product not found !" });
    }
    else {
        products.forEach((product) => {
            product.image_cover = `http://${req.hostname}:4000/${product.image_cover}`;
            const imageFilenames = product.image_gallery.split(",");
            product.image_gallery = JSON.parse(imageFilenames);

            if (Array.isArray(product.image_gallery)) {
                product.image_gallery = product.image_gallery.map(image => `${baseUrl}${image}`);
            }
        });

        res.status(200).json(products[0]);
    }

});

module.exports = router;