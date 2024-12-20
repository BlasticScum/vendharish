-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Slots table
CREATE TABLE IF NOT EXISTS Slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_time TIME NOT NULL,
    max_capacity INT NOT NULL DEFAULT 50,
    UNIQUE KEY unique_slot_time (slot_time)
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS Bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slot_id INT NOT NULL,
    visit_date DATE NOT NULL,
    num_tickets INT NOT NULL,
    adult_tickets INT NOT NULL DEFAULT 0,
    child_tickets INT NOT NULL DEFAULT 0,
    senior_tickets INT NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (slot_id) REFERENCES Slots(id)
);

-- Create Orders table
CREATE TABLE Orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    amount_due DECIMAL(10,2),
    amount_paid DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    receipt VARCHAR(255),
    status VARCHAR(50) DEFAULT 'created',
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES Bookings(id)
);

-- Create TicketPrices table
CREATE TABLE TicketPrices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_type ENUM('adult', 'child', 'senior') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ticket_type (ticket_type)
);

-- Create SystemSettings table
CREATE TABLE SystemSettings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_name VARCHAR(50) NOT NULL,
    setting_value BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_setting_name (setting_name)
);

-- Create News table
CREATE TABLE News (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default time slots
INSERT IGNORE INTO Slots (slot_time, max_capacity) VALUES
('10:00:00', 50),
('12:00:00', 50),
('14:00:00', 50),
('16:00:00', 50);

-- Insert default ticket prices
INSERT IGNORE INTO TicketPrices (ticket_type, price) VALUES
('adult', 50),
('child', 20),
('senior', 0);

-- Insert default system settings
INSERT IGNORE INTO SystemSettings (setting_name, setting_value) VALUES
('booking_system_enabled', true),
('news_ticker_enabled', true);

-- Create view for ticket details
CREATE OR REPLACE VIEW ticket_details AS
SELECT
    b.id as booking_id,
    b.visit_date,
    b.status as booking_status,
    b.adult_tickets,
    b.child_tickets,
    b.senior_tickets,
    b.num_tickets,
    u.username,
    u.email,
    u.phone,
    s.slot_time,
    o.razorpay_order_id,
    o.razorpay_payment_id,
    o.amount,
    o.status as payment_status
FROM Bookings b
JOIN Users u ON b.user_id = u.id
JOIN Slots s ON b.slot_id = s.id
LEFT JOIN Orders o ON b.id = o.booking_id;

-- Create trigger for auto-updating booking status
DROP TRIGGER IF EXISTS UpdateBookingStatus;
DELIMITER $$

CREATE TRIGGER UpdateBookingStatus
BEFORE UPDATE ON Bookings
FOR EACH ROW
BEGIN
    DECLARE slot_time TIME;

    SELECT slot_time INTO slot_time
    FROM Slots
    WHERE id = NEW.slot_id;

    IF (NEW.visit_date < CURDATE() OR
        (NEW.visit_date = CURDATE() AND slot_time < CURTIME())) THEN
        SET NEW.status = 'completed';
    ELSEIF (NEW.status = 'confirmed' AND
            (NEW.visit_date > CURDATE() OR
             (NEW.visit_date = CURDATE() AND slot_time > CURTIME()))) THEN
        SET NEW.status = 'confirmed';
    ELSEIF (NEW.status = 'cancelled') THEN
        SET NEW.status = 'cancelled';
    END IF;
END $$

DELIMITER ;

ALTER TABLE Bookings
ADD COLUMN completed_at TIMESTAMP NULL;

select * from Bookings;
select * from Users;
select * from Orders;
select * from Slots;
select * from SystemSettings;

-- Add settings table for feature toggles
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key_name, value) VALUES
('razorpay_enabled', 'true'),
('booking_system_enabled', 'true'),
('news_ticker_enabled', 'true')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Add indexes for better performance
ALTER TABLE Bookings ADD INDEX idx_visit_date (visit_date);
ALTER TABLE Bookings ADD INDEX idx_status (status);
ALTER TABLE Orders ADD INDEX idx_razorpay_order_id (razorpay_order_id);
