const router = require("express").Router();
const conn = require("../db/dbconnection");
const authhorized = require("../middelware/authraize");
const admin = require("../middelware/admin");
const { body, validationResult } = require('express-validator');
const upload = require("../middelware/upload");
const util = require("util");
const fs = require("fs");
// Admin add category
router.post("", admin,
    body("name").isString().withMessage("please enter vaild category name"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //valdate file


            //preper book object
            const category = {
                name: req.body.name,
            };
            const query = util.promisify(conn.query).bind(conn);
            await query("INSERT INTO categories SET ?", category);

            res.status(200).json({
                msg: "category created successfuly",
            });
        } catch (err) {
            res.status(500).json(err);
        }
    });
//Admin update category
router.put("/:id", admin,
    body("name").isString().withMessage("please enter vaild category name").isLength({ min: 3 }).withMessage("book name shoud be at lease 3 characters"),
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //brand is exit or not
            const category = await query("SELECT * from categories WHERE id = ?", [req.params.id]);
            if (!category[0]) {
                res.status(404).json({ msg: "category not found !" });
            }
            else {
                //preper brand object
                const categoryobj = {
                    name: req.body.name,
                };

                await query("UPDATE categories SET ? WHERE id = ?", [categoryobj, category[0].id]);
                res.status(200).json({
                    msg: "category updated successfuly",
                });
            }


        } catch (err) {
            res.status(500).json(err);
        }
    });
//Admin Delete category
router.delete("/:id", admin,
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //check exit brand or not
            const category = await query("SELECT * from categories WHERE id = ?", [req.params.id]);
            if (!category[0]) {
                res.status(404).json({ msg: "category not found !" });
            }
            //preper brand object
            else {

                await query("DELETE FROM categories  WHERE id = ?", [category[0].id]);
                res.status(200).json({
                    msg: "category is delete sucessfully !",
                });
            }

        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    });

router.get("", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const categories = await query("SELECT * FROM categories ")

    res.status(200).json(categories);
});
module.exports = router;