const router = require("express").Router();
const conn = require("../db/dbconnection");
const authhorized = require("../middelware/authraize");
const admin = require("../middelware/admin");
const { body, validationResult } = require('express-validator');
const upload = require("../middelware/upload");
const util = require("util");
const fs = require("fs");

//Admin add Brands 
router.post("", admin, upload.single("picture"),
    body("name").isString().withMessage("please enter vaild brand name").isLength({ min: 3 }).withMessage("book name shoud be at lease 3 characters"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //valdate file
            if (!req.file) {
                return res.status(400).json({
                    errors: [
                        {
                            msg: " image is required",
                        },
                    ],
                });
            }
            //preper book object
            const brand = {
                name: req.body.name,
                picture: req.file.filename,

            };
            const query = util.promisify(conn.query).bind(conn);
            await query("INSERT INTO brands SET ?", brand);

            res.status(200).json({
                msg: "brand created successfuly",
            });
        } catch (err) {
            res.status(500).json(err);
        }
    });
//Admin update brands
router.put("/:id", admin, upload.single("picture"),
    body("name").isString().withMessage("please enter vaild brand name").isLength({ min: 3 }).withMessage("book name shoud be at lease 3 characters"),
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //brand is exit or not
            const brand = await query("SELECT * from brands WHERE id = ?", [req.params.id]);
            if (!brand[0]) {
                res.status(404).json({ msg: "brand not found !" });
            }
            else {
                //preper brand object
                const brandobj = {
                    name: req.body.name,
                };
                if (req.file) {
                    brandobj.picture = req.file.filename;
                    fs.unlinkSync("./upload/" + brand[0].picture);
                }
                await query("UPDATE brands SET ? WHERE id = ?", [brandobj, brand[0].id]);
                res.status(200).json({
                    msg: "brand updated successfuly",
                });
            }


        } catch (err) {
            res.status(500).json(err);
        }
    });

// Admin delete brand
router.delete("/:id", admin,
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //check exit brand or not
            const brand = await query("SELECT * from brands WHERE id = ?", [req.params.id]);
            if (!brand[0]) {
                res.status(404).json({ msg: "brand not found !" });
            }
            //preper brand object
            else {

                fs.unlinkSync("./upload/" + brand[0].picture);
                await query("DELETE FROM brands  WHERE id = ?", [brand[0].id]);
                res.status(200).json({
                    msg: "brand is delete sucessfully !",
                });
            }

        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    });

// Admin list brands 
router.get("", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const brands = await query("SELECT * FROM brands ");
    brands.map((brand) => {
        brand.picture = "http://" + req.hostname + ":4000/" + brand.picture;

    })
    res.status(200).json(brands);
});




module.exports = router;