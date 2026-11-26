-- Seed Admin (admin@srpetworld.in / admin123) and Customer (user@srpetworld.in / user123)
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
('SR Farm Admin', 'admin@srpetworld.in', '9840012345', '$2a$10$jY5kUBFiNDWt5whYMehuYuA4ZAQ/47GosD1cc/.//tzWpn9wgse36', 'ROLE_ADMIN'),
('Karthik Rajan', 'user@srpetworld.in', '9840098765', '$2a$10$5SViFPD.mxOK0F76REZyNOctsRAlbm4BTd3iYba3cJOmshuwcZLvq', 'ROLE_USER');

-- Seed 4 Farm-Raised Bird Listings
INSERT INTO birds (name, category, age_tag, description, price_inr, stock_quantity, units_sold, image_url, active) VALUES
('Green & Yellow Budgerigar Pair', 'Parakeets', '4–5 Months • Bonded Pair', 'Healthy aviary-bred budgie pair with vibrant plumage, active and acclimated to Indian climate.', 650.00, 18, 12, 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=800&q=80', TRUE),
('Peach-Faced African Lovebird', 'Lovebirds', '5 Months • Semi-Tamed', 'Playful peach-faced lovebird raised on sprouted grains and fresh greens.', 1400.00, 10, 7, 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=800&q=80', TRUE),
('Lutino Cockatiel', 'Cockatiels', '6 Months • Hand-Fed', 'Gentle whistling Lutino cockatiel with bright cheek patches, ideal family companion.', 3200.00, 6, 4, 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=800&q=80', TRUE),
('Hand-Tamed Sun Conure', 'Conures', '7 Months • DNA Sexed', 'Affectionate hand-tamed Sun Conure with brilliant golden-orange feathers and health certificate.', 14500.00, 3, 2, 'https://images.unsplash.com/photo-1544923408-75c5cef46f14?auto=format&fit=crop&w=800&q=80', TRUE);

-- Seed 3 Completed Sample Orders for Immediate Admin Analytics
INSERT INTO orders (order_code, user_id, customer_name, customer_phone, delivery_address, fulfillment_type, subtotal_inr, delivery_fee_inr, total_inr, status, created_at) VALUES
('ORD-2401', 2, 'Karthik Rajan', '9840098765', '14 Gandhi Nagar, Coimbatore, TN 641001', 'DELIVERY', 2050.00, 150.00, 2200.00, 'DELIVERED', DATEADD('DAY', -5, CURRENT_TIMESTAMP)),
('ORD-2402', 2, 'Karthik Rajan', '9840098765', 'Farm Pickup — SR Pet World Aviary', 'PICKUP', 3200.00, 0.00, 3200.00, 'READY', DATEADD('DAY', -2, CURRENT_TIMESTAMP)),
('ORD-2403', 2, 'Karthik Rajan', '9840098765', '14 Gandhi Nagar, Coimbatore, TN 641001', 'DELIVERY', 14500.00, 150.00, 14650.00, 'CONFIRMED', DATEADD('DAY', -1, CURRENT_TIMESTAMP));

INSERT INTO order_items (order_id, bird_id, bird_name_snapshot, unit_price_inr, quantity) VALUES
(1, 1, 'Green & Yellow Budgerigar Pair', 650.00, 1),
(1, 2, 'Peach-Faced African Lovebird', 1400.00, 1),
(2, 3, 'Lutino Cockatiel', 3200.00, 1),
(3, 4, 'Hand-Tamed Sun Conure', 14500.00, 1);

INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method, amount_paise, currency, status, verified_at) VALUES
(1, 'order_seed_2401', 'pay_seed_2401', 'sig_seed_2401', 'upi', 220000, 'INR', 'CAPTURED', DATEADD('DAY', -5, CURRENT_TIMESTAMP)),
(2, 'order_seed_2402', 'pay_seed_2402', 'sig_seed_2402', 'card', 320000, 'INR', 'CAPTURED', DATEADD('DAY', -2, CURRENT_TIMESTAMP)),
(3, 'order_seed_2403', 'pay_seed_2403', 'sig_seed_2403', 'upi', 1465000, 'INR', 'CAPTURED', DATEADD('DAY', -1, CURRENT_TIMESTAMP));
