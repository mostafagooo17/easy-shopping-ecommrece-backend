const router = require("express").Router();
const conn = require("../db/dbconnection");
const authhorized = require("../middelware/authraize");
const admin = require("../middelware/admin");
const { body, validationResult } = require('express-validator');
const upload = require("../middelware/upload");
const util = require("util");
const fs = require("fs");

//customer add products to shopping cart
router.post("", authhorized,
    body("product_id").isInt().withMessage("Please enter a valid product ID."),
    body("quantity").isInt().withMessage("Please enter a valid quantity."),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const query = util.promisify(conn.query).bind(conn);
            const { token } = req.headers;
            const customers = await query(" SELECT * from customers WHERE token = ?", [token]);
            const shoppingCart = await query("SELECT * FROM shopping_carts WHERE customer_id = ?", customers[0].id);
            let shoppingCartId;

            if (shoppingCart.length > 0) {
                // The customer already has a shopping cart.
                // Use the existing shopping cart ID.
                shoppingCartId = shoppingCart[0].id;
            } else {
                // The customer does not have a shopping cart.
                // Create a new shopping cart.
                const newShoppingCart = {
                    customer_id: customers[0].id,
                };
                await query("INSERT INTO shopping_carts SET ?", newShoppingCart);
                shoppingCartId = newShoppingCart.id;
            }
            const productUnitPrice = await query("SELECT price_after_discount FROM products WHERE id = ?", req.body.product_id);

            const existingShoppingCartItem = await query("SELECT * FROM shopping_cart_items WHERE shopping_cart_id = ? AND product_id = ?", [shoppingCartId, req.body.product_id]);
            // If the product ID already exists in the shopping cart, update the quantity instead of inserting a new item.
            if (existingShoppingCartItem.length > 0) {
                await query("UPDATE shopping_cart_items SET quantity = quantity + ? WHERE shopping_cart_id = ? AND product_id = ?", [req.body.quantity, shoppingCartId, req.body.product_id]);
            } else {
                const shoppingCartItem = {
                    shopping_cart_id: shoppingCartId,
                    product_id: req.body.product_id,
                    quantity: req.body.quantity,
                    unit_price: productUnitPrice[0].price_after_discount,
                };

                // Insert a new shopping cart item.
                await query("INSERT INTO shopping_cart_items SET ?", shoppingCartItem);
            }

            // Get the product unit price.
            // Prepare the shopping cart item object.

            // Insert the shopping cart item into the database.

            // Respond to the client.
            res.status(200).json({ msg: "Shopping cart item created successfully." });
        } catch (err) {
            console.log(err);
            res.status(500).json({ err: "An error occurred while creating the shopping cart item." });
        }
    });

// customer delete his shopingcart items
router.delete("/:id", authhorized, async (req, res) => {
    try {
        const query = util.promisify(conn.query).bind(conn);

        // Get the customer ID from the token.
        const { token } = req.headers;
        const customers = await query("SELECT * from customers WHERE token = ?", [token]);

        // Get the shopping cart ID.
        const shopping_cart_id = req.params.id;

        // Check if the customer ID matches the customer ID in the shopping carts table.
        const shoppingCart = await query("SELECT * FROM shopping_carts WHERE customer_id = ?", customers[0].id);
        const shopping_cart_item = await query("SELECT * from shopping_cart_items WHERE id = ?", [req.params.id]);

        if (!shopping_cart_item[0]) {
            return res.status(404).json({ msg: "Shopping cart item not found!" });
        }
        if (
            shoppingCart[0].customer_id == customers[0].id &&
            shoppingCart[0].id == shopping_cart_item[0].shopping_cart_id
        ) {
            // Get the shopping cart item.


            // Delete the shopping cart item.
            await query("DELETE FROM shopping_cart_items WHERE id = ?", [shopping_cart_item[0].id]);

            // Respond to the client.
            return res.status(200).json({ msg: "Shopping cart item deleted successfully!" });
        } else {
            // The customer ID does not match the customer ID in the shopping carts table.
            return res.status(403).json({ err: "You are not authorized to delete this shopping cart item." });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

router.get("/", authhorized, async (req, res) => {
    try {
        const query = util.promisify(conn.query).bind(conn);

        // Get the customer ID from the token.
        const { token } = req.headers;
        const customers = await query("SELECT * from customers WHERE token = ?", [token]);
        const shoppingCart = await query("SELECT * FROM shopping_carts WHERE customer_id = ?", customers[0].id);

        // Get all of the shopping cart items for the customer.
        const shoppingCartItems = await query("SELECT * FROM shopping_cart_items WHERE shopping_cart_id = ?", shoppingCart[0].id);

        // Map the shopping cart items to shoppingCartitem objects.
        const shoppingCartitems = await Promise.all(shoppingCartItems.map(async (shoppingCartItem) => {
            const product = await query("SELECT * FROM products WHERE id = ?", shoppingCartItem.product_id);
            product[0].image_cover = "http://" + req.hostname + ":4000/" + product[0].image_cover;

            return {
                product_image_cover: product[0].image_cover,
                product_des: product[0].description,
                product_name: product[0].name,
                unit_price: shoppingCartItem.unit_price,
                quantity: shoppingCartItem.quantity,
            };
        }));

        // Return the shoppingCartitem objects in a single JSON object.
        res.status(200).json({ shoppingCartitems });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});



module.exports = router;