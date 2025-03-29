const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = "echosavvy";
const app = express();

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ecommerce",
    port: 3306, 
    connectTimeout: 10000
});

db.connect((err) => {
    if (err) {
        console.error("❌ Error connecting to MySQL:", err);
        return;
    }
    console.log("✅ Connected to MySQL");
});

app.post('/signup', async (req, res) => {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const checkSql = "SELECT * FROM users WHERE username = ?";
        
        db.query(checkSql, [username], (err, results) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });

            if (results.length > 0) {
                return res.status(400).json({ message: "Username already exists" });
            }

            const insertSql = "INSERT INTO users (username, phone, password) VALUES (?, ?, ?)";
            db.query(insertSql, [username, phone, hashedPassword], (err) => {
                if (err) return res.status(500).json({ message: "Database error", error: err });

                return res.json({ message: "User registered successfully" });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
});

// User Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const userQuery = "SELECT * FROM users WHERE username = ?";
        const [users] = await db.promise().query(userQuery, [username]);

        if (users.length === 0) {
            return res.json({ success: false, message: "User not found" });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
            expiresIn: "7d",
        });

        res.json({
            success: true,
            token,
            user_id: user.id,
            user: { id: user.id, username: user.username }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/cart/add', async (req, res) => { 
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user_id = decoded.id;  // ✅ Extract user_id from token
        const { product_id, product_name, price, quantity, image_url } = req.body;

        if (!product_id || !product_name || !price || !quantity || !image_url) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const total_amount = price * quantity;

        
        const [existing] = await db.promise().query(
            "SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?",
            [user_id, product_id]
        );

        if (existing.length > 0) {
            // ✅ If exists, update quantity
            const newQuantity = existing[0].quantity + quantity;
            await db.promise().query(
                "UPDATE cart SET quantity = ?, total_amount = price * ? WHERE user_id = ? AND product_id = ?",
                [newQuantity, newQuantity, user_id, product_id]
            );
            return res.status(200).json({ message: "Cart updated successfully" });
        }

        // ✅ Insert if not in cart
        await db.promise().query(
            "INSERT INTO cart (user_id, product_id, product_name, price, quantity, image_url, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [user_id, product_id, product_name, price, quantity, image_url, total_amount]
        );

        res.status(200).json({ message: "Added to cart successfully" });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

app.get('/api/cart', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user_id = decoded.id;

        const [results] = await db.promise().query(
            "SELECT * FROM cart WHERE user_id = ?",
            [user_id]
        );

        res.status(200).json(results.length > 0 ? results : []);
    } catch (error) {
        console.error("Error fetching cart items:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

app.delete('/api/cart/remove', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user_id = decoded.id;
        const { product_id } = req.body;

        await db.promise().query(
            "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
            [user_id, product_id]
        );

        res.status(200).json({ message: "Item removed from cart" });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

// ✅ Update Cart Item Quantity
app.put('/api/cart/update', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user_id = decoded.id;
        const { product_id, quantity } = req.body;

        await db.promise().query(
            "UPDATE cart SET quantity = ?, total_amount = price * ? WHERE user_id = ? AND product_id = ?",
            [quantity, quantity, user_id, product_id]
        );

        res.status(200).json({ message: "Cart updated successfully" });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Database error", error: error.message });
    }
});

app.listen(8082, () => {
    console.log("🚀 Server is running on http://localhost:8082");
});
