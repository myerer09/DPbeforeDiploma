require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: process.env.DB_PORT
});

// --- РЕЄСТРАЦІЯ ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role",
            [username, email, hashedPassword, role || 'buyer']
        );

        const secret = process.env.JWT_SECRET;
        const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, secret, { expiresIn: '24h' });

        res.json({ token, user: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Помилка при реєстрації" });
    }
});

// --- ВХІД ---
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const userResult = await pool.query(
            "SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)", 
            [identifier.trim()]
        );

        if (userResult.rows.length === 0) return res.status(400).json({ error: "користувача не знайдено" });

        const user = userResult.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(400).json({ error: "неправильний пароль" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: "помилка сервера" });
    }
});

// --- ТОВАРИ ---
app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query;
        let result = category && category !== 'Всі' 
            ? await pool.query("SELECT * FROM products WHERE category = $1 ORDER BY id DESC", [category])
            : await pool.query("SELECT * FROM products ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) { res.status(500).send("помилка"); }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, category, price, seller_id, image_url } = req.body;
        const newProduct = await pool.query(
            "INSERT INTO products (name, category, price, seller_id, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [name, category, price, seller_id, image_url]
        );
        res.json(newProduct.rows[0]);
    } catch (err) { res.status(500).json({ error: "не вдалося додати товар" }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, category, price, seller_id } = req.body;
        const result = await pool.query(
            "UPDATE products SET name = $1, category = $2, price = $3 WHERE id = $4 AND seller_id = $5 RETURNING *",
            [name, category, price, req.params.id, seller_id]
        );
        if (result.rowCount === 0) return res.status(403).json({ error: "Це не ваш товар!" });
        res.json({ message: "Товар оновлено" });
    } catch (err) { res.status(500).json({ error: "Помилка оновлення" }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { seller_id } = req.body;
        const result = await pool.query(
            "DELETE FROM products WHERE id = $1 AND seller_id = $2", 
            [req.params.id, seller_id]
        );
        if (result.rowCount === 0) return res.status(403).json({ error: "Це не ваш товар!" });
        res.json({ message: "Товар видалено" });
    } catch (err) { res.status(500).json({ error: "Помилка видалення" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}`));