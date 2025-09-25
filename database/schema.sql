-- TaniPintar Database Schema
-- PostgreSQL Database Schema for Railway Deployment

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS gardens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    avatar_url VARCHAR(500),
    ktp_number VARCHAR(20),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gardens table
CREATE TABLE gardens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    size DECIMAL(10,2), -- in square meters
    crop_type VARCHAR(100),
    planting_date DATE,
    estimated_harvest DATE,
    actual_harvest DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensors table
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    garden_id INTEGER NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL, -- temperature, humidity, soil_moisture, ph, etc
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- celsius, %, ppm, etc
    sensor_code VARCHAR(50), -- unique sensor identifier
    status VARCHAR(20) DEFAULT 'active',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pump schedules table
CREATE TABLE pump_schedules (
    id SERIAL PRIMARY KEY,
    garden_id INTEGER NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    pump_type VARCHAR(50) NOT NULL, -- water, fertilizer, nutrient, drainage
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    days_of_week VARCHAR(20) DEFAULT '1,2,3,4,5,6,7', -- comma separated
    last_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pump logs table
CREATE TABLE pump_logs (
    id SERIAL PRIMARY KEY,
    garden_id INTEGER NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    pump_type VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL, -- start, stop
    duration_seconds INTEGER,
    triggered_by VARCHAR(50) DEFAULT 'manual', -- manual, schedule, automation
    voltage DECIMAL(6,2),
    current DECIMAL(6,2),
    power DECIMAL(8,2),
    energy DECIMAL(10,3),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    garden_id INTEGER REFERENCES gardens(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather data cache table
CREATE TABLE weather_cache (
    id SERIAL PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    weather_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chatbot conversations table
CREATE TABLE chatbot_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_gardens_user_id ON gardens(user_id);
CREATE INDEX idx_gardens_status ON gardens(status);
CREATE INDEX idx_sensors_garden_id ON sensors(garden_id);
CREATE INDEX idx_sensors_type ON sensors(sensor_type);
CREATE INDEX idx_sensors_timestamp ON sensors(timestamp);
CREATE INDEX idx_pump_schedules_garden_id ON pump_schedules(garden_id);
CREATE INDEX idx_pump_schedules_active ON pump_schedules(is_active);
CREATE INDEX idx_pump_logs_garden_id ON pump_logs(garden_id);
CREATE INDEX idx_pump_logs_timestamp ON pump_logs(timestamp);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_weather_location ON weather_cache(location);
CREATE INDEX idx_weather_expires ON weather_cache(expires_at);
CREATE INDEX idx_chatbot_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_session ON chatbot_conversations(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gardens_updated_at BEFORE UPDATE ON gardens 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pump_schedules_updated_at BEFORE UPDATE ON pump_schedules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO users (email, password, name, phone) VALUES 
('admin@tanipintar.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6O5s0YJ1S2', 'Administrator', '08123456789')
ON CONFLICT (email) DO NOTHING;

-- Insert sample garden data
INSERT INTO gardens (user_id, name, description, location, size, crop_type, status) 
SELECT 
    u.id, 
    'Kebun Demo', 
    'Kebun demonstrasi untuk testing aplikasi TaniPintar',
    'Jakarta, Indonesia',
    100.0,
    'Sayuran',
    'active'
FROM users u 
WHERE u.email = 'admin@tanipintar.com'
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for Railway PostgreSQL)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO your_db_user;

COMMIT;
