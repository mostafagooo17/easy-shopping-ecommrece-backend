const router = require("express").Router();
const conn = require("../db/dbconnection");
const authhorized = require("../middelware/authraize");
const admin = require("../middelware/admin");
const { body, validationResult } = require('express-validator');
const upload = require("../middelware/upload");
const util = require("util");
const fs = require("fs");

router.post("", admin,
    body("name").isString().withMessage("please enter vaild subcategory name").isLength({ min: 3 }).withMessage("category name shoud be at lease 3 characters"),
    body("category_id").isInt().withMessage("please enter vaild category_id"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //preper subcategory object
            const subcategory = {
                name: req.body.name,
                category_id: req.body.category_id
            };
            const query = util.promisify(conn.query).bind(conn);
            await query("INSERT INTO subcategories SET ?", subcategory);

            res.status(200).json({
                msg: "subcategories created successfuly",
            });
        } catch (err) {
            res.status(500).json(err);
        }
    });
router.put("/:id", admin,
    body("name").isString().withMessage("please enter vaild subcategory name").isLength({ min: 3 }).withMessage("category name shoud be at lease 3 characters"),
    body("category_id").isInt().withMessage("please enter vaild category_id"),
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //brand is exit or not
            const subcategory = await query("SELECT * from subcategories WHERE id = ?", [req.params.id]);
            if (!subcategory[0]) {
                res.status(404).json({ msg: "subcategory not found !" });
            }
            else {
                //preper brand object
                const subcategoryobj = {
                    name: req.body.name,
                    category_id: req.body.category_id
                };

                await query("UPDATE subcategories SET ? WHERE id = ?", [subcategoryobj, subcategory[0].id]);
                res.status(200).json({
                    msg: "subcategory updated successfuly",
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
            const subcategory = await query("SELECT * from subcategories WHERE id = ?", [req.params.id]);
            if (!subcategory[0]) {
                res.status(404).json({ msg: "subcategory not found !" });
            }
            //preper brand object
            else {

                await query("DELETE FROM subcategories  WHERE id = ?", [subcategory[0].id]);
                res.status(200).json({
                    msg: "subcategory is delete sucessfully !",
                });
            }

        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    });

router.get("", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const subcategories = await query(`
            SELECT subcategories.*, categories.name AS category_name
            FROM subcategories
            JOIN categories
            ON subcategories.category_id = categories.id
        `);
    res.status(200).json(subcategories);
});

module.exports = router;