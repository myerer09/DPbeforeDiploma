# DPbeforeDiploma
Переддипломний проєкт: «Розробка системи управління контентом та автоматизації замовлень для онлайн-платформи хендмейд товарів».

*P.s: перший раз це роблю, не знаю чи пройде все успішно.*

Вимоги до середовища для локального запуску проєкту на вашому комп'ютері мають бути встановлені:
1. Node.js (рекомендовано версію 16.x або вище)
2. PostgreSQL (рекомендовано версію 12.x або вище)

Покрокова інструкція із запуску

Крок 1. Налаштування бази даних
1. Відкрийте pgAdmin або термінал PostgreSQL (psql).
2. Створіть нову базу даних для проєкту (наприклад, `handmade_db`):
   ```sql
   CREATE DATABASE handmade_db;
   ```
3. Виконайте SQL-скрипт для створення таблиць:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'buyer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url TEXT, 
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1
);
```

### Крок 2. Налаштування змінних оточення
У кореневій папці проєкту створіть файл `.env` (або перейменуйте існуючий `.env.example`, якщо він є) та пропишіть актуальні дані для підключення до вашої локальної БД:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ваш_пароль_від_postgres
DB_NAME=handmade_db
JWT_SECRET=super_secret_key_for_jwt
```

Крок 3. Встановлення залежностей
Відкрийте термінал у папці з проєктом та виконайте команду для завантаження всіх необхідних Node-модулів:
```bash
npm install
```

### Крок 4. Запуск сервера
Після успішного встановлення залежностей запустіть локальний сервер командою:
```bash
npm start
```

Якщо все налаштовано правильно, у терміналі з'явиться повідомлення: 
`Server is running on port 3000...` та `Connected to the database`.

Крок 5. Перегляд застосунку
Відкрийте браузер та перейдіть за адресою:
http://localhost:3000

*Примітка:* У рамках даного MVP (мінімально життєздатного продукту) реалізовано ролі "Покупець" та "Майстер". Панель Адміністратора спроєктована на рівні бази даних та архітектури, але її практична реалізація винесена на етап дипломного проєктування.
