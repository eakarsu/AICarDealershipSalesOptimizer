const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'car_dealership',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();

  try {
    // Create tables
    await client.query(`
      DROP TABLE IF EXISTS dealership_settings CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS commissions CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS marketing_campaigns CASCADE;
      DROP TABLE IF EXISTS customer_followups CASCADE;
      DROP TABLE IF EXISTS test_drives CASCADE;
      DROP TABLE IF EXISTS vehicle_inspections CASCADE;
      DROP TABLE IF EXISTS service_appointments CASCADE;
      DROP TABLE IF EXISTS deals CASCADE;
      DROP TABLE IF EXISTS trade_ins CASCADE;
      DROP TABLE IF EXISTS leads CASCADE;
      DROP TABLE IF EXISTS fni_products CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'sales',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE inventory (
        id SERIAL PRIMARY KEY,
        vin VARCHAR(17),
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        trim VARCHAR(100),
        color VARCHAR(50),
        mileage INTEGER DEFAULT 0,
        purchase_price DECIMAL(12,2),
        listing_price DECIMAL(12,2),
        ai_suggested_price DECIMAL(12,2),
        condition VARCHAR(50) DEFAULT 'Good',
        body_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'available',
        days_on_lot INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        budget_min DECIMAL(12,2),
        budget_max DECIMAL(12,2),
        preferred_make VARCHAR(100),
        preferred_type VARCHAR(50),
        credit_score_range VARCHAR(50),
        financing_needed BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE trade_ins (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        mileage INTEGER DEFAULT 0,
        condition VARCHAR(50),
        photo_url TEXT,
        ai_valuation DECIMAL(12,2),
        market_value DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE fni_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        base_price DECIMAL(12,2),
        commission_rate DECIMAL(5,2),
        provider VARCHAR(255),
        coverage_term VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE leads (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        source VARCHAR(100),
        interest_type VARCHAR(100),
        vehicle_interest VARCHAR(255),
        ai_score INTEGER,
        status VARCHAR(50) DEFAULT 'new',
        last_contact TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE deals (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        vehicle_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
        trade_in_id INTEGER REFERENCES trade_ins(id) ON DELETE SET NULL,
        sale_price DECIMAL(12,2),
        trade_in_value DECIMAL(12,2) DEFAULT 0,
        fni_total DECIMAL(12,2) DEFAULT 0,
        total_deal_value DECIMAL(12,2),
        profit_margin DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'pending',
        sales_person VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );


      CREATE TABLE service_appointments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        vehicle_description VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        estimated_duration INTEGER DEFAULT 60,
        assigned_technician VARCHAR(255),
        mileage_at_service INTEGER,
        description TEXT,
        parts_cost DECIMAL(12,2) DEFAULT 0,
        labor_cost DECIMAL(12,2) DEFAULT 0,
        total_cost DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE vehicle_inspections (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
        inspector_name VARCHAR(255) NOT NULL,
        inspection_type VARCHAR(100) NOT NULL,
        inspection_date TIMESTAMP DEFAULT NOW(),
        engine_rating VARCHAR(20) DEFAULT 'Good',
        transmission_rating VARCHAR(20) DEFAULT 'Good',
        brakes_rating VARCHAR(20) DEFAULT 'Good',
        suspension_rating VARCHAR(20) DEFAULT 'Good',
        tires_rating VARCHAR(20) DEFAULT 'Good',
        exterior_rating VARCHAR(20) DEFAULT 'Good',
        interior_rating VARCHAR(20) DEFAULT 'Good',
        electrical_rating VARCHAR(20) DEFAULT 'Good',
        overall_score INTEGER,
        issues_found TEXT,
        reconditioning_cost DECIMAL(12,2) DEFAULT 0,
        passed BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'completed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE test_drives (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        vehicle_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        vehicle_description VARCHAR(255) NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        sales_person VARCHAR(255),
        route_type VARCHAR(100),
        license_verified BOOLEAN DEFAULT false,
        insurance_verified BOOLEAN DEFAULT false,
        pre_drive_interest INTEGER,
        post_drive_interest INTEGER,
        feedback TEXT,
        outcome VARCHAR(100) DEFAULT 'pending',
        follow_up_date TIMESTAMP,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE customer_followups (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        contact_type VARCHAR(100) NOT NULL,
        direction VARCHAR(50) DEFAULT 'outbound',
        subject VARCHAR(255),
        notes TEXT,
        outcome VARCHAR(100),
        sales_person VARCHAR(255),
        follow_up_date TIMESTAMP,
        sentiment VARCHAR(50),
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'pending',
        contact_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE marketing_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        campaign_type VARCHAR(100) NOT NULL,
        channel VARCHAR(100),
        target_audience VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE,
        budget DECIMAL(12,2) DEFAULT 0,
        spent DECIMAL(12,2) DEFAULT 0,
        leads_generated INTEGER DEFAULT 0,
        deals_closed INTEGER DEFAULT 0,
        revenue_attributed DECIMAL(12,2) DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversion_rate DECIMAL(5,2) DEFAULT 0,
        roi DECIMAL(8,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE staff (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'sales',
        department VARCHAR(100) DEFAULT 'Sales',
        hire_date DATE,
        salary DECIMAL(12,2),
        commission_rate DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE commissions (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
        deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
        commission_type VARCHAR(100) DEFAULT 'vehicle_sale',
        sale_amount DECIMAL(12,2),
        commission_rate DECIMAL(5,2),
        commission_amount DECIMAL(12,2),
        pay_period VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        related_to VARCHAR(100),
        related_id INTEGER,
        description TEXT,
        file_name VARCHAR(255),
        file_size VARCHAR(50),
        uploaded_by VARCHAR(255),
        expiry_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE dealership_settings (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        label VARCHAR(255),
        value_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✓ Tables created');

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('admin@autogenius.com', '${hashedPassword}', 'Mike Johnson', 'admin'),
      ('sales@autogenius.com', '${hashedPassword}', 'Sarah Williams', 'sales'),
      ('manager@autogenius.com', '${hashedPassword}', 'Tom Davis', 'manager')
    `);
    console.log('✓ Users seeded (3)');

    // Seed Inventory (15 vehicles)
    await client.query(`
      INSERT INTO inventory (vin, make, model, year, trim, color, mileage, purchase_price, listing_price, condition, body_type, status, days_on_lot) VALUES
      ('1HGBH41JXMN109186', 'Toyota', 'Camry', 2024, 'XSE', 'Pearl White', 1200, 26500, 32995, 'Excellent', 'Sedan', 'available', 5),
      ('2T1BURHE0JC123456', 'Honda', 'CR-V', 2024, 'EX-L', 'Obsidian Blue', 3400, 29800, 36495, 'Excellent', 'SUV', 'available', 12),
      ('5YJSA1DG9DFP14616', 'Tesla', 'Model 3', 2023, 'Long Range', 'Midnight Silver', 15200, 35000, 41990, 'Good', 'Sedan', 'available', 22),
      ('WBAPH5C55BA271048', 'BMW', '330i', 2023, 'M Sport', 'Alpine White', 18500, 33000, 39750, 'Good', 'Sedan', 'available', 30),
      ('1G1YY22G965115897', 'Ford', 'F-150', 2024, 'Lariat', 'Iconic Silver', 5800, 42000, 52495, 'Excellent', 'Truck', 'available', 8),
      ('JTEBU5JR5D5234567', 'Toyota', 'RAV4', 2023, 'XLE Premium', 'Blueprint', 21000, 25500, 31200, 'Good', 'SUV', 'available', 35),
      ('1FTFW1E50MFA12345', 'Mercedes-Benz', 'C300', 2023, '4MATIC', 'Selenite Grey', 12400, 37500, 44990, 'Excellent', 'Sedan', 'available', 15),
      ('WA1LAAF77ND012345', 'Audi', 'Q5', 2024, 'Premium Plus', 'Navarra Blue', 4200, 41000, 49500, 'Excellent', 'SUV', 'available', 10),
      ('1N4BL4BV4LC123456', 'Nissan', 'Altima', 2023, 'SR', 'Scarlet Ember', 28000, 20500, 25990, 'Good', 'Sedan', 'available', 42),
      ('3MW5R1J04M8B12345', 'Chevrolet', 'Tahoe', 2024, 'LT', 'Black', 7500, 48000, 58750, 'Excellent', 'SUV', 'available', 6),
      ('JTDKN3DU5A0123456', 'Hyundai', 'Tucson', 2024, 'Limited', 'Amazon Gray', 2100, 29000, 35495, 'Excellent', 'SUV', 'available', 14),
      ('1G1ZT53846F123456', 'Lexus', 'RX 350', 2023, 'F Sport', 'Caviar Black', 16800, 39500, 47250, 'Good', 'SUV', 'available', 25),
      ('2HGFC2F59MH123456', 'Honda', 'Civic', 2024, 'Sport Touring', 'Rallye Red', 800, 24000, 29450, 'Excellent', 'Sedan', 'available', 3),
      ('1GCUYDED0MZ123456', 'GMC', 'Sierra 1500', 2023, 'Denali', 'Onyx Black', 19500, 46000, 55990, 'Good', 'Truck', 'available', 28),
      ('5YJ3E1EA1MF123456', 'Subaru', 'Outback', 2024, 'Limited', 'Autumn Green', 3600, 32000, 38750, 'Excellent', 'SUV', 'available', 9)
    `);
    console.log('✓ Inventory seeded (15 vehicles)');

    // Seed Customers (15)
    await client.query(`
      INSERT INTO customers (first_name, last_name, email, phone, budget_min, budget_max, preferred_make, preferred_type, credit_score_range, financing_needed, status) VALUES
      ('James', 'Anderson', 'james.a@email.com', '(555) 101-0001', 25000, 40000, 'Toyota', 'Sedan', '720-780', true, 'active'),
      ('Emily', 'Roberts', 'emily.r@email.com', '(555) 101-0002', 30000, 50000, 'Honda', 'SUV', '680-720', true, 'active'),
      ('Michael', 'Chen', 'michael.c@email.com', '(555) 101-0003', 35000, 55000, 'BMW', 'Sedan', '760-800', false, 'active'),
      ('Sarah', 'Martinez', 'sarah.m@email.com', '(555) 101-0004', 40000, 60000, 'Tesla', 'Sedan', '740-780', true, 'active'),
      ('David', 'Thompson', 'david.t@email.com', '(555) 101-0005', 45000, 65000, 'Audi', 'SUV', '780-820', false, 'active'),
      ('Jennifer', 'Lee', 'jennifer.l@email.com', '(555) 101-0006', 20000, 30000, 'Nissan', 'Sedan', '640-680', true, 'active'),
      ('Robert', 'Garcia', 'robert.g@email.com', '(555) 101-0007', 50000, 70000, 'Mercedes-Benz', 'SUV', '800-850', false, 'active'),
      ('Lisa', 'Wilson', 'lisa.w@email.com', '(555) 101-0008', 25000, 35000, 'Hyundai', 'SUV', '700-740', true, 'active'),
      ('William', 'Taylor', 'william.t@email.com', '(555) 101-0009', 28000, 42000, 'Subaru', 'SUV', '720-760', true, 'active'),
      ('Amanda', 'Brown', 'amanda.b@email.com', '(555) 101-0010', 35000, 50000, 'Lexus', 'SUV', '760-800', false, 'active'),
      ('Christopher', 'Davis', 'chris.d@email.com', '(555) 101-0011', 30000, 45000, 'Toyota', 'SUV', '700-740', true, 'active'),
      ('Jessica', 'Miller', 'jessica.m@email.com', '(555) 101-0012', 22000, 32000, 'Honda', 'Sedan', '680-720', true, 'active'),
      ('Daniel', 'Moore', 'daniel.m@email.com', '(555) 101-0013', 55000, 75000, 'Chevrolet', 'SUV', '780-820', false, 'active'),
      ('Ashley', 'Jackson', 'ashley.j@email.com', '(555) 101-0014', 40000, 55000, 'Ford', 'Truck', '740-780', true, 'active'),
      ('Matthew', 'White', 'matthew.w@email.com', '(555) 101-0015', 32000, 48000, 'GMC', 'Truck', '720-760', true, 'active')
    `);
    console.log('✓ Customers seeded (15)');

    // Seed Trade-Ins (15)
    await client.query(`
      INSERT INTO trade_ins (customer_id, make, model, year, mileage, condition, ai_valuation, market_value, status, notes) VALUES
      (1, 'Toyota', 'Corolla', 2019, 45000, 'Good', 15500, 16000, 'pending', 'Minor scratches on rear bumper'),
      (2, 'Honda', 'Accord', 2020, 32000, 'Excellent', 21000, 22000, 'appraised', 'One owner, full service history'),
      (3, 'BMW', '320i', 2018, 58000, 'Good', 18500, 19000, 'pending', 'New tires, needs brake pads'),
      (4, 'Chevrolet', 'Malibu', 2021, 25000, 'Excellent', 19000, 19500, 'accepted', 'Lease return, excellent condition'),
      (5, 'Audi', 'A4', 2019, 42000, 'Good', 23000, 24000, 'pending', 'Premium package, sunroof'),
      (6, 'Nissan', 'Sentra', 2020, 38000, 'Fair', 12000, 12500, 'appraised', 'Hail damage on hood'),
      (7, 'Mercedes-Benz', 'E300', 2018, 62000, 'Good', 26000, 27000, 'pending', 'AMG package, needs windshield'),
      (8, 'Hyundai', 'Elantra', 2021, 28000, 'Excellent', 16500, 17000, 'accepted', 'Clean CarFax, no accidents'),
      (9, 'Subaru', 'Forester', 2019, 51000, 'Good', 19500, 20000, 'pending', 'AWD, winter tires included'),
      (10, 'Lexus', 'IS 300', 2020, 35000, 'Excellent', 27000, 28000, 'appraised', 'F Sport package'),
      (11, 'Toyota', 'Highlander', 2018, 68000, 'Fair', 21000, 22000, 'pending', 'Third row, some wear on seats'),
      (12, 'Honda', 'Fit', 2020, 30000, 'Good', 14000, 14500, 'pending', 'Sport trim, manual transmission'),
      (13, 'Chevrolet', 'Silverado', 2019, 55000, 'Good', 28000, 29000, 'accepted', '4x4, towing package'),
      (14, 'Ford', 'Escape', 2021, 22000, 'Excellent', 22000, 23000, 'appraised', 'Hybrid, low miles'),
      (15, 'GMC', 'Canyon', 2020, 40000, 'Good', 24000, 25000, 'pending', 'All Terrain package')
    `);
    console.log('✓ Trade-ins seeded (15)');

    // Seed F&I Products (15)
    await client.query(`
      INSERT INTO fni_products (name, description, category, base_price, commission_rate, provider, coverage_term, is_active) VALUES
      ('Extended Warranty - Platinum', 'Comprehensive bumper-to-bumper coverage with $0 deductible', 'Warranty', 2495, 45.00, 'AutoShield Plus', '5 years / 100K miles', true),
      ('Extended Warranty - Gold', 'Powertrain plus major components coverage', 'Warranty', 1795, 40.00, 'AutoShield Plus', '4 years / 75K miles', true),
      ('Extended Warranty - Silver', 'Powertrain coverage only', 'Warranty', 995, 35.00, 'AutoShield Plus', '3 years / 50K miles', true),
      ('GAP Insurance', 'Covers the gap between insurance payout and loan balance', 'Insurance', 795, 50.00, 'SecureGap Financial', 'Term of loan', true),
      ('Paint & Fabric Protection', 'Professional ceramic coating with lifetime warranty', 'Protection', 599, 60.00, 'ShieldTech Pro', 'Lifetime', true),
      ('Tire & Wheel Protection', 'Coverage for tire and wheel damage from road hazards', 'Protection', 699, 55.00, 'RoadGuard', '3 years / unlimited', true),
      ('Theft Deterrent System', 'GPS tracking and VIN etching with recovery guarantee', 'Security', 399, 65.00, 'SecureVehicle', '5 years', true),
      ('Key Replacement', 'Replacement coverage for lost or damaged keys/fobs', 'Protection', 349, 55.00, 'KeySafe', '5 years', true),
      ('Windshield Protection', 'Repair or replacement for windshield damage', 'Protection', 299, 50.00, 'GlassGuard', '3 years', true),
      ('Dent & Ding Protection', 'Paintless dent repair for minor dents and dings', 'Protection', 449, 55.00, 'DentShield', '3 years / 5 repairs', true),
      ('Maintenance Package - Premium', 'All scheduled maintenance covered', 'Maintenance', 1299, 35.00, 'ServiceFirst', '3 years / 36K miles', true),
      ('Maintenance Package - Basic', 'Oil changes and tire rotations', 'Maintenance', 599, 30.00, 'ServiceFirst', '2 years / 24K miles', true),
      ('Prepaid Service Contract', 'Prepaid service visits at discounted rate', 'Maintenance', 899, 25.00, 'DealerDirect', '4 years / 8 visits', true),
      ('Credit Life Insurance', 'Pays off vehicle loan in case of death', 'Insurance', 1195, 40.00, 'LifeGuard Financial', 'Term of loan', true),
      ('Disability Insurance', 'Makes payments during disability period', 'Insurance', 895, 38.00, 'LifeGuard Financial', 'Term of loan', true)
    `);
    console.log('✓ F&I Products seeded (15)');

    // Seed Leads (15)
    await client.query(`
      INSERT INTO leads (customer_name, email, phone, source, interest_type, vehicle_interest, ai_score, status, last_contact, notes) VALUES
      ('Alex Johnson', 'alex.j@email.com', '(555) 201-0001', 'Website', 'New Vehicle', '2024 Toyota Camry XSE', 85, 'new', NOW() - INTERVAL '1 day', 'Filled out online form, requested quote'),
      ('Maria Gonzalez', 'maria.g@email.com', '(555) 201-0002', 'Walk-in', 'New Vehicle', '2024 Honda CR-V', 92, 'contacted', NOW() - INTERVAL '2 hours', 'Visited showroom, test drove CR-V'),
      ('Kevin Park', 'kevin.p@email.com', '(555) 201-0003', 'Referral', 'Used Vehicle', 'BMW 330i', 78, 'new', NULL, 'Referred by Michael Chen'),
      ('Rachel Adams', 'rachel.a@email.com', '(555) 201-0004', 'Social Media', 'New Vehicle', 'Tesla Model 3', 88, 'contacted', NOW() - INTERVAL '3 days', 'Engaged with our Instagram ad'),
      ('Brian Foster', 'brian.f@email.com', '(555) 201-0005', 'Phone Call', 'Trade-In', 'Ford F-150 Lariat', 71, 'qualified', NOW() - INTERVAL '1 day', 'Called about trading in truck'),
      ('Stephanie Kim', 'steph.k@email.com', '(555) 201-0006', 'Email Campaign', 'New Vehicle', 'Audi Q5', 65, 'new', NULL, 'Opened promo email, clicked CTA'),
      ('Carlos Rivera', 'carlos.r@email.com', '(555) 201-0007', 'Website', 'Financing', 'Mercedes-Benz C300', 82, 'contacted', NOW() - INTERVAL '5 hours', 'Pre-approval application started'),
      ('Nicole Turner', 'nicole.t@email.com', '(555) 201-0008', 'Walk-in', 'New Vehicle', 'Lexus RX 350', 95, 'qualified', NOW() - INTERVAL '4 hours', 'Ready to buy, comparing with competitor'),
      ('Jason Wright', 'jason.w@email.com', '(555) 201-0009', 'Third Party', 'Used Vehicle', 'Chevrolet Tahoe', 58, 'new', NULL, 'AutoTrader lead, initial inquiry'),
      ('Michelle Lee', 'michelle.l@email.com', '(555) 201-0010', 'Referral', 'New Vehicle', 'Hyundai Tucson', 76, 'contacted', NOW() - INTERVAL '2 days', 'Referred by Lisa Wilson'),
      ('Thomas Black', 'thomas.b@email.com', '(555) 201-0011', 'Website', 'Trade-In', 'Subaru Outback', 69, 'new', NULL, 'Submitted trade-in inquiry online'),
      ('Laura Sanchez', 'laura.s@email.com', '(555) 201-0012', 'Phone Call', 'New Vehicle', 'Honda Civic Sport', 87, 'qualified', NOW() - INTERVAL '6 hours', 'Pre-approved, scheduling test drive'),
      ('Ryan Cooper', 'ryan.c@email.com', '(555) 201-0013', 'Social Media', 'Financing', 'GMC Sierra Denali', 73, 'contacted', NOW() - INTERVAL '1 day', 'Facebook marketplace inquiry'),
      ('Angela Patel', 'angela.p@email.com', '(555) 201-0014', 'Walk-in', 'New Vehicle', 'Toyota RAV4', 91, 'qualified', NOW() - INTERVAL '1 hour', 'Second visit, narrowed to RAV4'),
      ('Derek Morgan', 'derek.m@email.com', '(555) 201-0015', 'Email Campaign', 'Used Vehicle', 'Nissan Altima', 54, 'new', NULL, 'Clicked email link, browsed inventory')
    `);
    console.log('✓ Leads seeded (15)');

    // Seed Deals (15)
    await client.query(`
      INSERT INTO deals (customer_id, vehicle_id, trade_in_id, sale_price, trade_in_value, fni_total, total_deal_value, profit_margin, status, sales_person) VALUES
      (1, 1, 1, 31500, 15500, 3290, 19290, 15.87, 'completed', 'Sarah Williams'),
      (2, 2, 2, 35000, 21000, 2495, 16495, 14.86, 'completed', 'Sarah Williams'),
      (3, 4, 3, 38500, 18500, 1795, 21795, 14.29, 'completed', 'Tom Davis'),
      (4, 3, 4, 40500, 19000, 3690, 25190, 13.58, 'financing', 'Sarah Williams'),
      (5, 8, 5, 48000, 23000, 2495, 27495, 14.29, 'pending', 'Tom Davis'),
      (6, 9, 6, 24500, 12000, 995, 13495, 16.33, 'completed', 'Sarah Williams'),
      (7, 7, 7, 43500, 26000, 4290, 21790, 13.79, 'completed', 'Tom Davis'),
      (8, 11, 8, 34000, 16500, 1598, 19098, 14.71, 'financing', 'Sarah Williams'),
      (9, 15, 9, 37500, 19500, 2094, 20094, 14.47, 'pending', 'Tom Davis'),
      (10, 12, 10, 46000, 27000, 3490, 22490, 13.80, 'completed', 'Sarah Williams'),
      (11, 6, 11, 30000, 21000, 1795, 10795, 14.52, 'completed', 'Tom Davis'),
      (12, 13, 12, 28500, 14000, 1299, 15799, 15.25, 'financing', 'Sarah Williams'),
      (13, 10, 13, 57000, 28000, 4290, 33290, 15.32, 'pending', 'Tom Davis'),
      (14, 5, 14, 51000, 22000, 2495, 31495, 17.14, 'completed', 'Sarah Williams'),
      (15, 14, 15, 54500, 24000, 3290, 33790, 15.14, 'completed', 'Tom Davis')
    `);
    console.log('✓ Deals seeded (15)');

    // Seed Service Appointments (15)
    await client.query(`
      INSERT INTO service_appointments (customer_id, vehicle_description, service_type, scheduled_date, estimated_duration, assigned_technician, mileage_at_service, description, parts_cost, labor_cost, total_cost, status) VALUES
      (1, '2019 Toyota Corolla', 'Oil Change', NOW() + INTERVAL '1 day', 45, 'Mike Rodriguez', 45000, 'Regular synthetic oil change', 45, 35, 80, 'scheduled'),
      (2, '2020 Honda Accord', 'Brake Service', NOW() + INTERVAL '2 days', 120, 'Jake Thompson', 32000, 'Front brake pads and rotors replacement', 285, 180, 465, 'scheduled'),
      (3, '2018 BMW 320i', 'Major Service - 60K', NOW() - INTERVAL '1 day', 240, 'Carlos Mendez', 58000, '60K mile major service including timing belt', 450, 380, 830, 'in_progress'),
      (4, '2021 Chevrolet Malibu', 'Tire Rotation', NOW() + INTERVAL '3 days', 30, 'Mike Rodriguez', 25000, 'Rotate and balance all four tires', 0, 40, 40, 'scheduled'),
      (5, '2019 Audi A4', 'AC Repair', NOW() - INTERVAL '3 days', 180, 'Jake Thompson', 42000, 'AC not blowing cold, likely compressor issue', 520, 240, 760, 'completed'),
      (6, '2020 Nissan Sentra', 'Transmission Service', NOW() + INTERVAL '5 days', 150, 'Carlos Mendez', 38000, 'Transmission fluid flush and filter change', 180, 150, 330, 'scheduled'),
      (7, '2018 Mercedes-Benz E300', 'Diagnostic', NOW() - INTERVAL '2 days', 60, 'Jake Thompson', 62000, 'Check engine light on, running rough', 0, 150, 150, 'completed'),
      (8, '2021 Hyundai Elantra', 'Oil Change', NOW() + INTERVAL '4 days', 45, 'Mike Rodriguez', 28000, 'Synthetic oil change with filter', 45, 35, 80, 'scheduled'),
      (9, '2019 Subaru Forester', 'Alignment', NOW() - INTERVAL '5 days', 60, 'Carlos Mendez', 51000, 'Four wheel alignment after new tires', 0, 90, 90, 'completed'),
      (10, '2020 Lexus IS 300', 'Battery Replacement', NOW() + INTERVAL '1 day', 30, 'Mike Rodriguez', 35000, 'Battery failing load test', 180, 45, 225, 'scheduled'),
      (11, '2018 Toyota Highlander', 'Recall Service', NOW() + INTERVAL '2 days', 90, 'Jake Thompson', 68000, 'Safety recall - airbag module update', 0, 0, 0, 'scheduled'),
      (12, '2020 Honda Fit', 'Brake Inspection', NOW() - INTERVAL '4 days', 45, 'Carlos Mendez', 30000, 'Customer reports squealing noise when braking', 0, 65, 65, 'completed'),
      (13, '2019 Chevrolet Silverado', 'Major Service - 50K', NOW() + INTERVAL '6 days', 210, 'Jake Thompson', 55000, '50K mile service with differential fluid change', 320, 280, 600, 'scheduled'),
      (14, '2021 Ford Escape', 'Hybrid Battery Check', NOW() - INTERVAL '1 day', 90, 'Carlos Mendez', 22000, 'Routine hybrid battery health check', 0, 120, 120, 'in_progress'),
      (15, '2020 GMC Canyon', 'Suspension Repair', NOW() + INTERVAL '7 days', 180, 'Jake Thompson', 40000, 'Front strut replacement, bouncy ride', 380, 220, 600, 'scheduled')
    `);
    console.log('✓ Service appointments seeded (15)');

    // Seed Vehicle Inspections (15)
    await client.query(`
      INSERT INTO vehicle_inspections (vehicle_id, inspector_name, inspection_type, inspection_date, engine_rating, transmission_rating, brakes_rating, suspension_rating, tires_rating, exterior_rating, interior_rating, electrical_rating, overall_score, issues_found, reconditioning_cost, passed, status, notes) VALUES
      (1, 'Tom Davis', 'Pre-Sale', NOW() - INTERVAL '5 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 98, 'Minor dust in cabin filter', 25, true, 'completed', 'Nearly new condition'),
      (2, 'Tom Davis', 'Pre-Sale', NOW() - INTERVAL '12 days', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 92, 'Brake pads at 60%, tires at 70%', 0, true, 'completed', 'Excellent overall condition'),
      (3, 'Sarah Williams', 'Certified Pre-Owned', NOW() - INTERVAL '22 days', 'Good', 'Good', 'Good', 'Good', 'Fair', 'Good', 'Good', 'Good', 78, 'Tires need replacement within 10K miles, minor paint chip on hood', 850, true, 'completed', 'Qualifies for CPO with tire replacement'),
      (4, 'Tom Davis', 'Pre-Sale', NOW() - INTERVAL '30 days', 'Good', 'Good', 'Fair', 'Good', 'Good', 'Good', 'Good', 'Excellent', 75, 'Brake pads at 30%, recommend replacement before sale', 450, true, 'completed', 'Good condition, needs brakes'),
      (5, 'Sarah Williams', 'Pre-Sale', NOW() - INTERVAL '8 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 96, 'No issues found', 0, true, 'completed', 'Exceptional truck'),
      (6, 'Tom Davis', 'Trade-In', NOW() - INTERVAL '35 days', 'Good', 'Good', 'Good', 'Fair', 'Fair', 'Fair', 'Good', 'Good', 68, 'Suspension bushings worn, paint fade on roof, tires at 40%', 1200, true, 'completed', 'Average condition for age and mileage'),
      (7, 'Sarah Williams', 'Pre-Sale', NOW() - INTERVAL '15 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 95, 'Minor windshield chip (repaired)', 75, true, 'completed', 'Premium vehicle in great shape'),
      (8, 'Tom Davis', 'Certified Pre-Owned', NOW() - INTERVAL '10 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 97, 'No issues', 0, true, 'completed', 'Audi CPO certified'),
      (9, 'Sarah Williams', 'Pre-Sale', NOW() - INTERVAL '42 days', 'Good', 'Good', 'Good', 'Good', 'Fair', 'Good', 'Fair', 'Good', 70, 'Interior wear on driver seat, tires at 35%', 600, true, 'completed', 'Needs detailing and tire replacement'),
      (10, 'Tom Davis', 'Pre-Sale', NOW() - INTERVAL '6 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 94, 'Small scratch on rear quarter panel', 150, true, 'completed', 'Near-perfect condition'),
      (11, 'Sarah Williams', 'Pre-Sale', NOW() - INTERVAL '14 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 93, 'No significant issues', 50, true, 'completed', 'Great family SUV'),
      (12, 'Tom Davis', 'Certified Pre-Owned', NOW() - INTERVAL '25 days', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 82, 'Minor curb rash on one wheel', 200, true, 'completed', 'CPO eligible after wheel touch-up'),
      (13, 'Sarah Williams', 'Pre-Sale', NOW() - INTERVAL '3 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 97, 'Perfect condition', 0, true, 'completed', 'Showroom ready'),
      (14, 'Tom Davis', 'Safety', NOW() - INTERVAL '28 days', 'Good', 'Fair', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 72, 'Transmission shows slight hesitation on upshift, recommend monitoring', 0, false, 'completed', 'Passed safety but flagged transmission'),
      (15, 'Sarah Williams', 'Pre-Sale', NOW() - INTERVAL '9 days', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 91, 'Slight oil seepage at valve cover gasket', 250, true, 'completed', 'Minor repair recommended')
    `);
    console.log('✓ Vehicle inspections seeded (15)');

    // Seed Test Drives (15)
    await client.query(`
      INSERT INTO test_drives (customer_id, vehicle_id, customer_name, vehicle_description, scheduled_date, duration_minutes, sales_person, route_type, license_verified, insurance_verified, pre_drive_interest, post_drive_interest, feedback, outcome, notes, status) VALUES
      (1, 1, 'James Anderson', '2024 Toyota Camry XSE', NOW() - INTERVAL '2 days', 30, 'Sarah Williams', 'Mixed', true, true, 7, 9, 'Loved the handling and tech features', 'completed', 'Very enthusiastic, asked about financing', 'completed'),
      (2, 2, 'Emily Roberts', '2024 Honda CR-V EX-L', NOW() - INTERVAL '1 day', 45, 'Sarah Williams', 'Highway', true, true, 8, 9, 'Perfect family size, great fuel economy display', 'completed', 'Bringing spouse back tomorrow', 'completed'),
      (3, 4, 'Michael Chen', '2023 BMW 330i M Sport', NOW() + INTERVAL '1 day', 30, 'Tom Davis', 'Mixed', true, true, 9, NULL, NULL, 'pending', 'Scheduled for tomorrow morning', 'scheduled'),
      (4, 3, 'Sarah Martinez', '2023 Tesla Model 3 LR', NOW() - INTERVAL '3 days', 60, 'Sarah Williams', 'Highway', true, true, 8, 10, 'First EV experience, blown away by acceleration', 'purchased', 'Signed paperwork same day', 'completed'),
      (5, 8, 'David Thompson', '2024 Audi Q5 Premium Plus', NOW() + INTERVAL '2 days', 45, 'Tom Davis', 'City', true, true, 7, NULL, NULL, 'pending', 'Wants to compare with BMW X3', 'scheduled'),
      (6, 9, 'Jennifer Lee', '2023 Nissan Altima SR', NOW() - INTERVAL '5 days', 30, 'Sarah Williams', 'City', true, true, 6, 7, 'Nice car but slightly over budget', 'completed', 'Discussing financing options', 'completed'),
      (7, 7, 'Robert Garcia', '2023 Mercedes-Benz C300', NOW() - INTERVAL '4 days', 45, 'Tom Davis', 'Highway', true, true, 9, 9, 'Excellent build quality, loves the interior', 'completed', 'Comparing with Audi A4', 'completed'),
      (8, 11, 'Lisa Wilson', '2024 Hyundai Tucson Limited', NOW() + INTERVAL '3 days', 30, 'Sarah Williams', 'Mixed', false, false, 7, NULL, NULL, 'pending', 'Need to verify license first', 'scheduled'),
      (9, 15, 'William Taylor', '2024 Subaru Outback Limited', NOW() - INTERVAL '2 days', 45, 'Tom Davis', 'Mixed', true, true, 8, 8, 'Great AWD system, perfect for camping trips', 'completed', 'Interested but wants to think', 'completed'),
      (10, 12, 'Amanda Brown', '2023 Lexus RX 350 F Sport', NOW() - INTERVAL '6 days', 30, 'Sarah Williams', 'Highway', true, true, 9, 10, 'Luxury feel exceeded expectations', 'purchased', 'Deal closed within 48 hours', 'completed'),
      (11, 6, 'Christopher Davis', '2023 Toyota RAV4 XLE', NOW() + INTERVAL '1 day', 30, 'Tom Davis', 'City', true, true, 7, NULL, NULL, 'pending', 'Second test drive - bringing wife', 'scheduled'),
      (12, 13, 'Jessica Miller', '2024 Honda Civic Sport Touring', NOW() - INTERVAL '3 days', 30, 'Sarah Williams', 'Mixed', true, true, 8, 8, 'Sporty yet practical, great tech', 'completed', 'Wants to compare with Mazda3', 'completed'),
      (13, 10, 'Daniel Moore', '2024 Chevrolet Tahoe LT', NOW() + INTERVAL '4 days', 60, 'Tom Davis', 'Highway', true, true, 8, NULL, NULL, 'pending', 'Wants extended highway test', 'scheduled'),
      (14, 5, 'Ashley Jackson', '2024 Ford F-150 Lariat', NOW() - INTERVAL '1 day', 45, 'Sarah Williams', 'Mixed', true, true, 9, 9, 'Towing capability impressive, great tech', 'completed', 'Ready to negotiate', 'completed'),
      (15, 14, 'Matthew White', '2023 GMC Sierra Denali', NOW() - INTERVAL '7 days', 45, 'Tom Davis', 'Highway', true, true, 8, 7, 'Great truck but prefers F-150 interior', 'declined', 'Lost to Ford F-150', 'completed')
    `);
    console.log('✓ Test drives seeded (15)');

    // Seed Customer Follow-ups (15)
    await client.query(`
      INSERT INTO customer_followups (customer_id, customer_name, contact_type, direction, subject, notes, outcome, sales_person, follow_up_date, sentiment, priority, status, contact_date) VALUES
      (1, 'James Anderson', 'Phone Call', 'outbound', 'Post test drive follow-up', 'Discussed financing options for Camry, very interested', 'Connected', 'Sarah Williams', NOW() + INTERVAL '2 days', 'Positive', 'High', 'completed', NOW() - INTERVAL '1 day'),
      (2, 'Emily Roberts', 'Email', 'outbound', 'CR-V comparison sheet', 'Sent detailed comparison with competitors', 'Email Sent', 'Sarah Williams', NOW() + INTERVAL '3 days', 'Positive', 'High', 'completed', NOW() - INTERVAL '2 days'),
      (3, 'Michael Chen', 'Phone Call', 'inbound', 'Price negotiation inquiry', 'Called asking about BMW pricing flexibility', 'Connected', 'Tom Davis', NOW() + INTERVAL '1 day', 'Neutral', 'High', 'completed', NOW() - INTERVAL '3 hours'),
      (4, 'Sarah Martinez', 'Text', 'outbound', 'Delivery confirmation', 'Confirmed delivery date and time for Model 3', 'Replied', 'Sarah Williams', NULL, 'Positive', 'Medium', 'completed', NOW() - INTERVAL '1 day'),
      (5, 'David Thompson', 'Email', 'outbound', 'Audi Q5 features overview', 'Sent brochure and financing pre-approval', 'Email Sent', 'Tom Davis', NOW() + INTERVAL '2 days', 'Neutral', 'Medium', 'pending', NOW() - INTERVAL '4 days'),
      (6, 'Jennifer Lee', 'Phone Call', 'outbound', 'Budget-friendly options', 'Left voicemail about lower-priced alternatives', 'Voicemail', 'Sarah Williams', NOW() + INTERVAL '1 day', 'Neutral', 'Medium', 'pending', NOW() - INTERVAL '2 days'),
      (7, 'Robert Garcia', 'In-Person', 'inbound', 'Second visit - decision time', 'Came in to compare C300 final numbers', 'Meeting Scheduled', 'Tom Davis', NOW() + INTERVAL '1 day', 'Positive', 'High', 'completed', NOW() - INTERVAL '1 day'),
      (8, 'Lisa Wilson', 'Email', 'outbound', 'License verification reminder', 'Reminded to bring license for test drive', 'Email Sent', 'Sarah Williams', NOW() + INTERVAL '3 days', 'Neutral', 'Low', 'pending', NOW() - INTERVAL '1 day'),
      (9, 'William Taylor', 'Phone Call', 'outbound', 'Outback follow-up', 'Discussed trade-in value for current vehicle', 'Connected', 'Tom Davis', NOW() + INTERVAL '5 days', 'Positive', 'Medium', 'completed', NOW() - INTERVAL '2 days'),
      (10, 'Amanda Brown', 'Phone Call', 'outbound', 'Satisfaction check', 'Post-purchase satisfaction call, very happy', 'Connected', 'Sarah Williams', NOW() + INTERVAL '30 days', 'Positive', 'Low', 'completed', NOW() - INTERVAL '5 days'),
      (11, 'Christopher Davis', 'Text', 'outbound', 'Test drive reminder', 'Reminded about scheduled RAV4 test drive', 'Replied', 'Tom Davis', NOW() + INTERVAL '1 day', 'Positive', 'Medium', 'completed', NOW() - INTERVAL '12 hours'),
      (12, 'Jessica Miller', 'Email', 'outbound', 'Civic vs Mazda3 comparison', 'Sent detailed comparison document', 'Email Sent', 'Sarah Williams', NOW() + INTERVAL '4 days', 'Neutral', 'Medium', 'pending', NOW() - INTERVAL '3 days'),
      (13, 'Daniel Moore', 'Phone Call', 'inbound', 'Tahoe availability check', 'Asked about color options and inventory', 'Connected', 'Tom Davis', NOW() + INTERVAL '4 days', 'Positive', 'High', 'completed', NOW() - INTERVAL '2 days'),
      (14, 'Ashley Jackson', 'Phone Call', 'outbound', 'F-150 deal proposal', 'Presented final pricing with trade-in', 'Connected', 'Sarah Williams', NOW() + INTERVAL '1 day', 'Positive', 'High', 'completed', NOW() - INTERVAL '6 hours'),
      (15, 'Matthew White', 'Email', 'outbound', 'Alternative truck options', 'Sent F-150 info since he preferred it over Sierra', 'No Answer', 'Tom Davis', NOW() + INTERVAL '7 days', 'Negative', 'Low', 'overdue', NOW() - INTERVAL '7 days')
    `);
    console.log('✓ Customer follow-ups seeded (15)');

    // Seed Marketing Campaigns (15)
    await client.query(`
      INSERT INTO marketing_campaigns (name, campaign_type, channel, target_audience, start_date, end_date, budget, spent, leads_generated, deals_closed, revenue_attributed, impressions, clicks, conversion_rate, roi, status, notes) VALUES
      ('Spring Clearance Event', 'Event', 'Multi-channel', 'All buyers', '2025-03-01', '2025-03-31', 15000, 12500, 45, 8, 285000, 150000, 4500, 3.00, 1900.00, 'completed', 'Best spring event in 3 years'),
      ('SUV Season Facebook Ads', 'Digital Ads', 'Facebook', 'SUV shoppers 30-55', '2025-04-01', '2025-04-30', 5000, 4800, 28, 4, 165000, 85000, 2800, 3.29, 3337.50, 'active', 'Strong engagement on carousel ads'),
      ('Certified Pre-Owned Google Ads', 'Digital Ads', 'Google Ads', 'CPO buyers', '2025-03-15', '2025-06-15', 8000, 5200, 35, 5, 195000, 120000, 3200, 2.67, 2750.00, 'active', 'High intent keywords performing well'),
      ('Holiday Season Email Blast', 'Email', 'Email List', 'Past customers', '2024-12-01', '2024-12-31', 1200, 1200, 18, 3, 98000, 25000, 850, 3.40, 8066.67, 'completed', 'Reactivated 3 dormant leads'),
      ('New Arrivals Instagram', 'Social Media', 'Instagram', 'Young professionals 25-40', '2025-04-10', NULL, 3000, 1800, 15, 1, 42000, 45000, 1200, 2.67, 2233.33, 'active', 'Stories performing better than posts'),
      ('Truck Month TV Spot', 'TV/Radio', 'Local TV', 'Truck buyers', '2025-02-01', '2025-02-28', 25000, 25000, 32, 6, 310000, 500000, 0, 0.00, 1140.00, 'completed', 'Strong brand awareness lift'),
      ('Referral Bonus Program', 'Referral Program', 'In-store', 'Existing customers', '2025-01-01', '2025-12-31', 10000, 3500, 22, 7, 275000, 0, 0, 31.82, 7757.14, 'active', '$500 referral bonus per sale'),
      ('Service Customer Upsell Mailer', 'Direct Mail', 'USPS', 'Service customers due for upgrade', '2025-03-01', '2025-03-15', 3500, 3500, 12, 2, 72000, 8000, 0, 0.00, 1957.14, 'completed', 'Targeted 3+ year old vehicle owners'),
      ('Memorial Day Weekend Sale', 'Event', 'Multi-channel', 'All buyers', '2025-05-24', '2025-05-27', 12000, 2000, 5, 0, 0, 35000, 1500, 4.29, -100.00, 'draft', 'Planning phase'),
      ('YouTube Vehicle Walkthroughs', 'Social Media', 'YouTube', 'Research-phase buyers', '2025-02-15', NULL, 2000, 1500, 8, 1, 38000, 65000, 1800, 2.77, 2433.33, 'active', '360-degree vehicle tours'),
      ('Lease-End Conquest Campaign', 'Email', 'Email List', 'Competitors lease-ending customers', '2025-04-01', '2025-04-30', 2500, 1800, 14, 2, 78000, 12000, 450, 3.75, 4233.33, 'active', 'Purchased lease-end prospect list'),
      ('Local Sports Sponsorship', 'TV/Radio', 'Local Radio', 'Sports fans 25-55', '2025-01-01', '2025-06-30', 18000, 12000, 20, 3, 125000, 300000, 0, 0.00, 941.67, 'active', 'High school and college sports'),
      ('First-Time Buyer Workshop', 'Event', 'In-store', 'First-time car buyers', '2025-04-20', '2025-04-20', 800, 0, 0, 0, 0, 2500, 85, 3.40, 0.00, 'draft', 'Free credit education seminar'),
      ('TikTok Behind-the-Scenes', 'Social Media', 'TikTok', 'Gen Z buyers 18-30', '2025-03-01', NULL, 1500, 1200, 6, 0, 0, 180000, 5500, 3.06, -100.00, 'active', 'Day-in-the-life content, growing following'),
      ('Trade-In Value Boost Promo', 'Digital Ads', 'Google Ads', 'Trade-in prospects', '2025-04-15', '2025-05-15', 4000, 1500, 10, 1, 35000, 40000, 1600, 4.00, 2233.33, 'active', '$1000 over KBB trade-in value promotion')
    `);
    console.log('✓ Marketing campaigns seeded (15)');

    // Seed Staff
    await client.query(`
      INSERT INTO staff (first_name, last_name, email, phone, role, department, hire_date, salary, commission_rate, status) VALUES
      ('Sarah', 'Williams', 'sarah@autogenius.com', '555-0101', 'sales', 'Sales', '2023-03-15', 48000, 5.0, 'active'),
      ('Tom', 'Davis', 'tom@autogenius.com', '555-0102', 'manager', 'Management', '2021-08-01', 75000, 3.0, 'active'),
      ('Mike', 'Johnson', 'mike@autogenius.com', '555-0103', 'admin', 'Admin', '2020-01-10', 85000, 0, 'active'),
      ('Jessica', 'Brown', 'jessica@autogenius.com', '555-0104', 'sales', 'Sales', '2023-09-01', 45000, 5.5, 'active'),
      ('David', 'Wilson', 'david@autogenius.com', '555-0105', 'sales', 'Sales', '2024-01-15', 42000, 4.5, 'active'),
      ('Emily', 'Martinez', 'emily@autogenius.com', '555-0106', 'finance', 'Finance', '2022-06-01', 62000, 2.0, 'active'),
      ('James', 'Anderson', 'james@autogenius.com', '555-0107', 'technician', 'Service', '2023-04-20', 55000, 0, 'active'),
      ('Lisa', 'Taylor', 'lisa@autogenius.com', '555-0108', 'sales', 'Sales', '2024-06-01', 43000, 5.0, 'active'),
      ('Robert', 'Thomas', 'robert@autogenius.com', '555-0109', 'technician', 'Service', '2022-11-15', 58000, 0, 'active'),
      ('Amanda', 'Garcia', 'amanda@autogenius.com', '555-0110', 'sales', 'Sales', '2023-12-01', 46000, 5.0, 'on_leave')
    `);
    console.log('✓ Staff seeded (10)');

    // Seed Commissions
    await client.query(`
      INSERT INTO commissions (staff_id, deal_id, commission_type, sale_amount, commission_rate, commission_amount, pay_period, status, notes) VALUES
      (1, 1, 'vehicle_sale', 42000, 5.0, 2100, '2025-03', 'paid', 'March sale - Toyota Camry'),
      (1, 3, 'vehicle_sale', 55000, 5.0, 2750, '2025-03', 'paid', 'March sale - BMW X3'),
      (4, 2, 'vehicle_sale', 38000, 5.5, 2090, '2025-03', 'paid', 'March sale - Honda Accord'),
      (5, 5, 'vehicle_sale', 35000, 4.5, 1575, '2025-03', 'pending', 'Pending approval'),
      (1, 7, 'fni_product', 3500, 10.0, 350, '2025-03', 'paid', 'Extended warranty commission'),
      (4, 4, 'vehicle_sale', 48000, 5.5, 2640, '2025-04', 'pending', 'April sale pending close'),
      (8, 8, 'vehicle_sale', 29000, 5.0, 1450, '2025-03', 'paid', 'March sale'),
      (5, 10, 'vehicle_sale', 52000, 4.5, 2340, '2025-04', 'pending', 'Awaiting deal completion'),
      (1, NULL, 'referral', 0, 0, 500, '2025-03', 'paid', 'Customer referral bonus'),
      (4, NULL, 'bonus', 0, 0, 1000, '2025-03', 'paid', 'Top performer Q1 bonus'),
      (2, 6, 'vehicle_sale', 62000, 3.0, 1860, '2025-03', 'paid', 'Manager override commission'),
      (8, 12, 'vehicle_sale', 33000, 5.0, 1650, '2025-04', 'pending', 'April sale'),
      (6, 1, 'fni_product', 2800, 2.0, 56, '2025-03', 'paid', 'F&I product commission'),
      (6, 3, 'fni_product', 4200, 2.0, 84, '2025-03', 'paid', 'F&I product commission'),
      (1, 14, 'vehicle_sale', 45000, 5.0, 2250, '2025-04', 'pending', 'April sale in progress')
    `);
    console.log('✓ Commissions seeded (15)');

    // Seed Documents
    await client.query(`
      INSERT INTO documents (title, document_type, related_to, related_id, description, file_name, file_size, uploaded_by, expiry_date, status) VALUES
      ('2024 Toyota Camry Title', 'title', 'vehicle', 1, 'Original vehicle title', 'title_camry_2024.pdf', '1.2 MB', 'Mike Johnson', NULL, 'active'),
      ('2024 Honda Accord Title', 'title', 'vehicle', 2, 'Original vehicle title', 'title_accord_2024.pdf', '1.1 MB', 'Mike Johnson', NULL, 'active'),
      ('BMW X3 Warranty', 'warranty', 'vehicle', 3, 'Extended manufacturer warranty', 'warranty_bmw_x3.pdf', '2.4 MB', 'Emily Martinez', '2027-06-15', 'active'),
      ('Smith Purchase Contract', 'contract', 'deal', 1, 'Signed purchase agreement', 'contract_smith_001.pdf', '3.2 MB', 'Sarah Williams', NULL, 'active'),
      ('Johnson Purchase Contract', 'contract', 'deal', 2, 'Signed purchase agreement', 'contract_johnson_002.pdf', '3.1 MB', 'Jessica Brown', NULL, 'active'),
      ('Dealer License 2025', 'registration', 'dealership', 1, 'Annual dealer license renewal', 'dealer_license_2025.pdf', '0.8 MB', 'Mike Johnson', '2025-12-31', 'active'),
      ('Insurance Certificate', 'insurance', 'dealership', 1, 'General liability insurance', 'insurance_cert_2025.pdf', '1.5 MB', 'Mike Johnson', '2025-09-30', 'active'),
      ('Trade-In Appraisal #5', 'inspection', 'trade_in', 5, 'Detailed trade-in condition report', 'appraisal_tradein_5.pdf', '4.1 MB', 'James Anderson', NULL, 'active'),
      ('Customer Davis Credit App', 'contract', 'customer', 3, 'Credit application form', 'credit_app_davis.pdf', '0.9 MB', 'Emily Martinez', NULL, 'active'),
      ('Inventory Invoice - March', 'invoice', 'dealership', 1, 'Monthly vehicle acquisition invoice', 'invoice_march_2025.pdf', '2.8 MB', 'Tom Davis', NULL, 'active'),
      ('Ford F-150 Inspection', 'inspection', 'vehicle', 5, 'Pre-sale inspection report', 'inspection_f150.pdf', '5.2 MB', 'James Anderson', NULL, 'active'),
      ('Gap Insurance Policy', 'insurance', 'deal', 3, 'GAP insurance documentation', 'gap_insurance_003.pdf', '1.8 MB', 'Emily Martinez', '2028-03-15', 'active'),
      ('Expired Dealer Bond', 'registration', 'dealership', 1, 'Previous year dealer bond', 'dealer_bond_2024.pdf', '0.7 MB', 'Mike Johnson', '2024-12-31', 'expired'),
      ('Tesla Model 3 Title', 'title', 'vehicle', 8, 'Electric vehicle title', 'title_tesla_m3.pdf', '1.0 MB', 'Mike Johnson', NULL, 'active'),
      ('Service Agreement Template', 'contract', 'dealership', 1, 'Standard service agreement', 'service_agreement_tpl.pdf', '0.5 MB', 'Tom Davis', NULL, 'active')
    `);
    console.log('✓ Documents seeded (15)');

    // Seed Dealership Settings
    await client.query(`
      INSERT INTO dealership_settings (category, setting_key, setting_value, label, value_type) VALUES
      ('general', 'dealership_name', 'AutoGenius Motors', 'Dealership Name', 'text'),
      ('general', 'address', '1234 Auto Drive, Springfield, IL 62701', 'Address', 'text'),
      ('general', 'phone', '(555) 123-4567', 'Phone Number', 'text'),
      ('general', 'email', 'info@autogenius.com', 'Email', 'text'),
      ('general', 'website', 'www.autogenius.com', 'Website', 'text'),
      ('financial', 'sales_tax_rate', '7.25', 'Sales Tax Rate (%)', 'number'),
      ('financial', 'doc_fee', '499', 'Documentation Fee ($)', 'number'),
      ('financial', 'title_fee', '150', 'Title Fee ($)', 'number'),
      ('financial', 'registration_fee', '250', 'Registration Fee ($)', 'number'),
      ('financial', 'default_commission_rate', '5.0', 'Default Commission Rate (%)', 'number'),
      ('hours', 'weekday_open', '9:00 AM', 'Weekday Opening', 'text'),
      ('hours', 'weekday_close', '8:00 PM', 'Weekday Closing', 'text'),
      ('hours', 'saturday_open', '9:00 AM', 'Saturday Opening', 'text'),
      ('hours', 'saturday_close', '6:00 PM', 'Saturday Closing', 'text'),
      ('hours', 'sunday_open', '11:00 AM', 'Sunday Opening', 'text'),
      ('hours', 'sunday_close', '5:00 PM', 'Sunday Closing', 'text'),
      ('notifications', 'email_notifications', 'true', 'Email Notifications', 'boolean'),
      ('notifications', 'low_inventory_alert', 'true', 'Low Inventory Alerts', 'boolean'),
      ('notifications', 'deal_completion_alert', 'true', 'Deal Completion Alerts', 'boolean'),
      ('notifications', 'lead_assignment_alert', 'true', 'Lead Assignment Alerts', 'boolean'),
      ('inventory', 'aging_threshold_warning', '60', 'Aging Warning (days)', 'number'),
      ('inventory', 'aging_threshold_critical', '90', 'Aging Critical (days)', 'number'),
      ('inventory', 'auto_price_reduction', 'false', 'Auto Price Reduction', 'boolean'),
      ('inventory', 'price_reduction_percent', '5', 'Price Reduction (%)', 'number')
    `);
    console.log('✓ Dealership settings seeded (24)');

    console.log('\n✅ Database seeded successfully!\n');

  } catch (err) {
    console.error('Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
