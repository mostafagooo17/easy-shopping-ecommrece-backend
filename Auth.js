const router = require("express").Router();
const conn = require("../db/dbconnection");
const { body, validationResult } = require('express-validator');
const util = require("util");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const admin = require("../middelware/admin");
const authhorized = require("../middelware/authraize");

//login 
router.post("/login", body("email").isEmail().withMessage("please enter vaild email"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
    async (req, res) => {
        try {
            //1-valldtion requst
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //2-check email exist in customer table or admin table
            const query = util.promisify(conn.query).bind(conn);
            const customer = await query(" SELECT * from customers WHERE email = ?", [req.body.email]);
            const admin = await query(" SELECT * from admins WHERE email = ?", [req.body.email]);
            //3-if email exist in customer table check password
            if (customer.length != 0) {
                const checkPassword = await bcrypt.compare(req.body.password, customer[0].password);
                if (checkPassword) {
                    delete customer[0].password;
                    // Send the response.
                    res.status(200).json(customer[0]);

                }
                else {
                    res.status(404).json({
                        errors:
                            [
                                {
                                    "msg": "email or password not found !",

                                },
                            ],
                    });

                }
            }
            //3-if email exist in admin table check password
            else if (admin.length != 0) {
                const checkPassword = await bcrypt.compare(req.body.password, admin[0].password);
                if (checkPassword) {
                    delete admin[0].password;
                    // Send the response.
                    res.status(200).json(admin[0]);
                }
                else {
                    res.status(404).json({
                        errors:
                            [
                                {
                                    "msg": "email or password not found !",

                                },
                            ],
                    });

                }
            }
            //4-if email is not exist in any table return error
            else {
                res.status(404).json({
                    errors:
                        [
                            {
                                "msg": "email or password not found !",

                            },
                        ],
                });
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ err: err });
        }
    });

//registration reader
router.post("/register", body("email").isEmail().withMessage("please enter vaild email"),
    body("first_name").isString().withMessage("please enter vaild  first name"),
    body("last_name").isString().withMessage("please enter vaild  last name"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
    body("phone").isNumeric().withMessage("please in your phone"),
    body("shipping_address").isString().withMessage("please enter vaild  shipping_address"),
    body("billing_address").isString().withMessage("please enter vaild  billing_address"),
    async (req, res) => {
        try {
            //1-valldtion requst
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const query = util.promisify(conn.query).bind(conn);
            const checkEmailExists = await query(" SELECT * from customers  WHERE email = ?", [req.body.email]);
            if (checkEmailExists.length > 0) {
                res.status(400).json({
                    errors:
                        [
                            {
                                "msg": "email aready exists !",

                            },
                        ],

                });
                return;
            }
            else {
                const customer = {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    password: await bcrypt.hash(req.body.password, 10),
                    token: crypto.randomBytes(16).toString("hex"),
                    phone: req.body.phone,
                    shipping_address: req.body.shipping_address,
                    billing_address: req.body.billing_address,
                };
                await query("insert into customers set ?", customer);
                res.status(200).json(customer);
                return;
            }


        } catch (err) {
            console.log(err);
            res.status(500).json({ err: err });
        }
    });




// update user emali
router.put("/:id", authhorized, body("email").isEmail().withMessage("please enter vaild email"),
    body("first_name").isString().withMessage("please enter vaild  first name"),
    body("last_name").isString().withMessage("please enter vaild  last name"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
    body("phone").isNumeric().withMessage("please in your phone"),
    body("shipping_address").isString().withMessage("please enter vaild  shipping_address"),
    body("billing_address").isString().withMessage("please enter vaild  billing_address"),
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //user is exit or not
            const customer = await query("SELECT * from customers WHERE id = ?", [req.params.id]);
            if (!customer[0]) {
                res.status(404).json({ msg: "customer not found !" });
            }
            else {

                //preper user object
                const customerobj = {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    password: await bcrypt.hash(req.body.password, 10),
                    phone: req.body.phone,
                    shipping_address: req.body.shipping_address,
                    billing_address: req.body.billing_address,
                };

                await query("UPDATE customers SET ? WHERE id = ?", [customerobj, customer[0].id]);

                res.status(200).json({
                    msg: "customer updated successfuly",
                });
            }
        } catch (err) {
            res.status(500).json(err);
        }
    });

//delete user
router.delete("/:id", authhorized,
    async (req, res) => {
        try {
            const query = util.promisify(conn.query).bind(conn);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //check exit user or not
            const customer = await query("SELECT * from customers WHERE id = ?", [req.params.id]);
            if (!customer[0]) {
                res.status(404).json({ msg: "customer not found !" });
            }
            else {


                await query("DELETE FROM customers  WHERE id = ?", [customer[0].id]);


                res.status(200).json({
                    msg: "customer is delete sucessfully !",
                });
            }

        } catch (err) {
            res.status(500).json(err);
        }
    });

module.exports = router;

