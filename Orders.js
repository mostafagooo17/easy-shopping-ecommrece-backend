const router = require("express").Router();
const conn = require("../db/dbconnection");
const authhorized = require("../middelware/authraize");
const admin = require("../middelware/admin");
const { body, validationResult } = require('express-validator');
const upload = require("../middelware/upload");
const util = require("util");
const fs = require("fs");

//cutmoer checkout and add his order
router.post("", authhorized,
    body("shipping_address").isString().withMessage("Please enter a valid shipping address."),
    body("billing_address").isString().withMessage("Please enter a valid billing address."),
    body("payment_method").isString().withMessage("Please enter a valid  payment_method."),
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
            const shoppingCartItems = await query("SELECT * FROM shopping_cart_items WHERE shopping_cart_id = ?", shoppingCart[0].id);
            const total = shoppingCartItems.reduce((acc, shoppingCartItem) => {
                return acc + (shoppingCartItem.unit_price * shoppingCartItem.quantity);
            }, 0);
            const order = {
                customer_id: customers[0].id,
                shipping_address: req.body.shipping_address,
                billing_address: req.body.billing_address,
                payment_method: req.body.payment_method,
                order_total: total,
            };
            // Insert a new shopping cart item.
            await query("INSERT INTO orders SET ?", order);
            // Respond to the client.
            res.status(200).json({ msg: "order created successfully." });
        } catch (err) {
            console.log(err);
            res.status(500).json({ err: "An error occurred while creating order." });
        }
    });

//custmoer can delete his order if order stutus is pending
router.delete("/:id", authhorized, async (req, res) => {
    try {
        const query = util.promisify(conn.query).bind(conn);

        // Get the customer ID from the token.
        const { token } = req.headers;
        const customers = await query("SELECT * from customers WHERE token = ?", [token]);
        const order = await query("SELECT * FROM orders WHERE customer_id = ? AND id = ?", [customers[0].id, req.params.id]);
        if (!order[0]) {
            return res.status(404).json({ msg: " order not found!" });
        }

        // Check if the order status is pending.
        if (order[0].order_status === "pending") {
            // Delete the order from the database.
            await query("DELETE FROM orders WHERE id = ?", req.params.id);
            return res.status(200).json({ msg: "Order deleted successfully!" });
        } else {
            // Return an error message if the order status is not pending.
            return res.status(400).json({ msg: "Order status must be pending to delete." });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

//list oders for admin
router.get("/", admin, async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const orders = await query("SELECT * FROM orders ");
    res.status(200).json(orders);
});

// admin update order_stutus to shipped

router.put("/:id", admin, async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);

    // Check if the order exists.
    const orders = await query("SELECT * FROM orders WHERE id = ?", req.params.id);
    if (orders.length === 0) {
        return res.status(404).json({ msg: "Order not found." });
    }

    // Update the order status to shipped.
    await query("UPDATE orders SET order_status = 'shipped' WHERE id = ?", req.params.id);

    res.status(200).json({ msg: "Order status updated successfully!" });
});
//list oders for customer
router.get("/", authhorized, async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);

    // Get the customer ID from the token.
    const { token } = req.headers;
    const customers = await query("SELECT * from customers WHERE token = ?", [token]);
    const orders = await query("SELECT * FROM orders WHERE customer_id = ? AND id = ?", customers[0].id);
    res.status(200).json(orders);
});

module.exports = router;




















module.exports = router;