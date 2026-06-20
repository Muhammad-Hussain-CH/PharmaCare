CREATE TABLE sales (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(30) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NULL,
  sold_by INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('cash', 'card', 'mobile') NOT NULL DEFAULT 'cash',
  payment_status ENUM('paid', 'pending', 'partial', 'refunded') NOT NULL DEFAULT 'paid',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_sold_by FOREIGN KEY (sold_by) REFERENCES users(user_id)
);

CREATE TABLE sale_items (
  sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  medicine_id INT NOT NULL,
  medicine_name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_items_sale_id FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_medicine_id FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);
