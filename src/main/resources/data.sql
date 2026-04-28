-- RigLab seed data. Idempotent inserts using INSERT IGNORE — safe to re-run.
-- Detail tables use component_id (Hibernate's default for @MapsId + @OneToOne).

-- ============ CPUs ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (1, 'Ryzen 7 7800X3D', 'AMD',   'CPU', 349.99, 120, 'https://m.media-amazon.com/images/I/61PYO9wcgmL._AC_SL1500_.jpg'),
  (2, 'Ryzen 5 7600X',   'AMD',   'CPU', 229.99, 105, 'https://m.media-amazon.com/images/I/71xfk2ksm-L._AC_SL1500_.jpg'),
  (3, 'Ryzen 9 7950X',   'AMD',   'CPU', 549.99, 170, 'https://m.media-amazon.com/images/I/61PFTzo9ssL._AC_SL1500_.jpg'),
  (4, 'Core i7-14700K',  'Intel', 'CPU', 399.99, 125, 'https://m.media-amazon.com/images/I/61y0Q7Cb1pL._AC_SL1500_.jpg'),
  (5, 'Core i5-14600K',  'Intel', 'CPU', 299.99, 125, 'https://m.media-amazon.com/images/I/61PFTzo9ssL._AC_SL1500_.jpg'),
  (6, 'Core i9-14900K',  'Intel', 'CPU', 589.99, 150, 'https://m.media-amazon.com/images/I/61y0Q7Cb1pL._AC_SL1500_.jpg');

INSERT IGNORE INTO cpu_details (component_id, socket, cores, threads, base_clock, boost_clock) VALUES
  (1, 'AM5',     8,  16, 4.2, 5.0),
  (2, 'AM5',     6,  12, 4.7, 5.3),
  (3, 'AM5',     16, 32, 4.5, 5.7),
  (4, 'LGA1700', 20, 28, 3.4, 5.6),
  (5, 'LGA1700', 14, 20, 3.5, 5.3),
  (6, 'LGA1700', 24, 32, 3.2, 6.0);

-- ============ GPUs ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (10, 'RTX 4090',       'NVIDIA', 'GPU', 1599.99, 450, 'https://m.media-amazon.com/images/I/61gkQwZQB6L._AC_SL1500_.jpg'),
  (11, 'RTX 4080 SUPER', 'NVIDIA', 'GPU',  999.99, 320, 'https://m.media-amazon.com/images/I/61gkQwZQB6L._AC_SL1500_.jpg'),
  (12, 'RTX 4070',       'NVIDIA', 'GPU',  549.99, 200, 'https://m.media-amazon.com/images/I/91Q1OHwf3eL._AC_SL1500_.jpg'),
  (13, 'RTX 4060',       'NVIDIA', 'GPU',  299.99, 115, 'https://m.media-amazon.com/images/I/71ar1QH-Z8L._AC_SL1500_.jpg'),
  (14, 'RX 7900 XTX',    'AMD',    'GPU',  899.99, 355, 'https://m.media-amazon.com/images/I/71+oxsOM9zL._AC_SL1500_.jpg'),
  (15, 'RX 7800 XT',     'AMD',    'GPU',  499.99, 263, 'https://m.media-amazon.com/images/I/71+oxsOM9zL._AC_SL1500_.jpg');

INSERT IGNORE INTO gpu_details (component_id, vram, length_mm, recommended_psu, performance_score) VALUES
  (10, 24, 336, 850, 35000),
  (11, 16, 304, 750, 28000),
  (12, 12, 285, 650, 22000),
  (13,  8, 245, 550, 17000),
  (14, 24, 287, 800, 27000),
  (15, 16, 267, 700, 21000);

-- ============ Motherboards ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (20, 'B650 AORUS ELITE',     'GIGABYTE', 'MOTHERBOARD', 219.99, 30, 'https://m.media-amazon.com/images/I/81bhIhNlbtL._AC_SL1500_.jpg'),
  (21, 'X670E HERO',           'ASUS',     'MOTHERBOARD', 599.99, 35, 'https://m.media-amazon.com/images/I/81OhMqIplhL._AC_SL1500_.jpg'),
  (22, 'X670E STEEL LEGEND',   'ASRock',   'MOTHERBOARD', 329.99, 30, 'https://m.media-amazon.com/images/I/81bhIhNlbtL._AC_SL1500_.jpg'),
  (23, 'Z790 TOMAHAWK',        'MSI',      'MOTHERBOARD', 269.99, 30, 'https://m.media-amazon.com/images/I/81RFmZNhPHL._AC_SL1500_.jpg'),
  (24, 'Z790 AORUS MASTER',    'GIGABYTE', 'MOTHERBOARD', 499.99, 35, 'https://m.media-amazon.com/images/I/81RFmZNhPHL._AC_SL1500_.jpg'),
  (25, 'B760M PRO RS',         'ASRock',   'MOTHERBOARD', 129.99, 25, 'https://m.media-amazon.com/images/I/81qEY7N1fjL._AC_SL1500_.jpg');

INSERT IGNORE INTO motherboard_details (component_id, socket, chipset, form_factor, supported_ram_type, ram_slots, m2_slots, sata_connectors) VALUES
  (20, 'AM5',     'B650',  'ATX',       'DDR5', 4, 2, 4),
  (21, 'AM5',     'X670E', 'ATX',       'DDR5', 4, 4, 6),
  (22, 'AM5',     'X670E', 'ATX',       'DDR5', 4, 3, 8),
  (23, 'LGA1700', 'Z790',  'ATX',       'DDR5', 4, 3, 6),
  (24, 'LGA1700', 'Z790',  'ATX',       'DDR5', 4, 5, 6),
  (25, 'LGA1700', 'B760',  'Micro-ATX', 'DDR5', 2, 2, 4);

-- ============ RAM ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (30, 'Vengeance 16GB DDR5-6000',     'Corsair',  'RAM', 64.99, 5, 'https://m.media-amazon.com/images/I/71wkW5J9Y0L._AC_SL1500_.jpg'),
  (31, 'Vengeance 32GB DDR5-6000',     'Corsair',  'RAM',119.99, 6, 'https://m.media-amazon.com/images/I/71wkW5J9Y0L._AC_SL1500_.jpg'),
  (32, 'Trident Z5 16GB DDR5-6400',    'G.Skill',  'RAM', 79.99, 5, 'https://m.media-amazon.com/images/I/71qsK0jQQ8L._AC_SL1500_.jpg'),
  (33, 'Trident Z5 32GB DDR5-7200',    'G.Skill',  'RAM',169.99, 6, 'https://m.media-amazon.com/images/I/71qsK0jQQ8L._AC_SL1500_.jpg'),
  (34, 'Fury Beast 16GB DDR5-5600',    'Kingston', 'RAM', 54.99, 5, 'https://m.media-amazon.com/images/I/71Z9wpY4cQL._AC_SL1500_.jpg'),
  (35, 'Vengeance LPX 16GB DDR4-3600', 'Corsair',  'RAM', 39.99, 4, 'https://m.media-amazon.com/images/I/71kJfQDgZBL._AC_SL1500_.jpg');

INSERT IGNORE INTO ram_details (component_id, capacity_gb, type, speed_mhz) VALUES
  (30, 16, 'DDR5', 6000),
  (31, 32, 'DDR5', 6000),
  (32, 16, 'DDR5', 6400),
  (33, 32, 'DDR5', 7200),
  (34, 16, 'DDR5', 5600),
  (35, 16, 'DDR4', 3600);

-- ============ PSUs ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (40, 'RM1000x 1000W',  'Corsair',  'PSU', 199.99, 1000, 'https://m.media-amazon.com/images/I/71eJ12MBnhL._AC_SL1500_.jpg'),
  (41, 'RM850x 850W',    'Corsair',  'PSU', 159.99,  850, 'https://m.media-amazon.com/images/I/71eJ12MBnhL._AC_SL1500_.jpg'),
  (42, 'RM750e 750W',    'Corsair',  'PSU', 109.99,  750, 'https://m.media-amazon.com/images/I/71QAOHk3WBL._AC_SL1500_.jpg'),
  (43, 'SF600 600W',     'Corsair',  'PSU',  99.99,  600, 'https://m.media-amazon.com/images/I/61F5UV4uHmL._AC_SL1500_.jpg'),
  (44, 'Focus GX-650',   'Seasonic', 'PSU', 119.99,  650, 'https://m.media-amazon.com/images/I/61yh1zZoYRL._AC_SL1500_.jpg'),
  (45, 'PRIME TX-1000',  'Seasonic', 'PSU', 279.99, 1000, 'https://m.media-amazon.com/images/I/61yh1zZoYRL._AC_SL1500_.jpg');

INSERT IGNORE INTO psu_details (component_id, wattage, efficiency_rating) VALUES
  (40, 1000, '80+ Gold'),
  (41,  850, '80+ Gold'),
  (42,  750, '80+ Gold'),
  (43,  600, '80+ Platinum'),
  (44,  650, '80+ Gold'),
  (45, 1000, '80+ Titanium');

-- ============ Cases ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (50, '4000D Airflow',     'Corsair',       'CASE',  99.99, 0, 'https://m.media-amazon.com/images/I/71y3MeQ5G1L._AC_SL1500_.jpg'),
  (51, '5000D Airflow',     'Corsair',       'CASE', 169.99, 0, 'https://m.media-amazon.com/images/I/71y3MeQ5G1L._AC_SL1500_.jpg'),
  (52, 'NR200P',            'Cooler Master', 'CASE',  89.99, 0, 'https://m.media-amazon.com/images/I/71y9jsIyuML._AC_SL1500_.jpg'),
  (53, 'O11 Dynamic EVO',   'Lian Li',       'CASE', 169.99, 0, 'https://m.media-amazon.com/images/I/71hiR6bN9YL._AC_SL1500_.jpg'),
  (54, 'Meshify 2',         'Fractal',       'CASE', 149.99, 0, 'https://m.media-amazon.com/images/I/61bLF+W5UoL._AC_SL1500_.jpg'),
  (55, 'Pop Mini Air',      'Fractal',       'CASE',  79.99, 0, 'https://m.media-amazon.com/images/I/61bLF+W5UoL._AC_SL1500_.jpg');

INSERT IGNORE INTO case_details (component_id, supported_form_factor, max_gpu_length_mm) VALUES
  (50, 'ATX, Micro-ATX, Mini-ITX',         360),
  (51, 'E-ATX, ATX, Micro-ATX, Mini-ITX',  400),
  (52, 'Mini-ITX, Micro-ATX',              330),
  (53, 'E-ATX, ATX, Micro-ATX, Mini-ITX',  422),
  (54, 'E-ATX, ATX, Micro-ATX, Mini-ITX',  467),
  (55, 'Micro-ATX, Mini-ITX',              335);

-- ============ Storage ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (60, '990 PRO 2TB',         'Samsung',  'STORAGE', 169.99, 8, 'https://m.media-amazon.com/images/I/81bZpZ5Z9HL._AC_SL1500_.jpg'),
  (61, '990 PRO 1TB',         'Samsung',  'STORAGE',  89.99, 7, 'https://m.media-amazon.com/images/I/81+VKnZS1OL._AC_SL1500_.jpg'),
  (62, '870 EVO 1TB SATA',    'Samsung',  'STORAGE',  79.99, 4, 'https://m.media-amazon.com/images/I/81+VKnZS1OL._AC_SL1500_.jpg'),
  (63, 'KC3000 1TB',          'Kingston', 'STORAGE',  79.99, 7, 'https://m.media-amazon.com/images/I/61+T4S8Q1OL._AC_SL1500_.jpg'),
  (64, 'BarraCuda 4TB HDD',   'Seagate',  'STORAGE',  84.99, 6, 'https://m.media-amazon.com/images/I/81HuNYdpQGL._AC_SL1500_.jpg'),
  (65, 'WD Black SN850X 2TB', 'WD',       'STORAGE', 159.99, 8, 'https://m.media-amazon.com/images/I/81bZpZ5Z9HL._AC_SL1500_.jpg');

INSERT IGNORE INTO storage_details (component_id, capacity_gb, storage_type, interface_type, read_speed_mbps, write_speed_mbps) VALUES
  (60, 2000, 'NVMe', 'M.2',  7450, 6900),
  (61, 1000, 'NVMe', 'M.2',  7000, 5100),
  (62, 1000, 'SSD',  'SATA',  560,  530),
  (63, 1000, 'NVMe', 'M.2',  7000, 6000),
  (64, 4000, 'HDD',  'SATA',  190,  190),
  (65, 2000, 'NVMe', 'M.2',  7300, 6600);

-- ============ Coolers ============
INSERT IGNORE INTO components (id, name, brand, type, price, power_consumption, image_url) VALUES
  (70, 'NH-D15',                  'Noctua',        'COOLER', 109.99,  6, 'https://m.media-amazon.com/images/I/71+lwClMeEL._AC_SL1500_.jpg'),
  (71, 'NH-U12S redux',           'Noctua',        'COOLER',  49.99,  4, 'https://m.media-amazon.com/images/I/71+lwClMeEL._AC_SL1500_.jpg'),
  (72, 'iCUE H150i ELITE',        'Corsair',       'COOLER', 219.99, 12, 'https://m.media-amazon.com/images/I/61bhVzSmQ1L._AC_SL1500_.jpg'),
  (73, 'iCUE H100i ELITE',        'Corsair',       'COOLER', 169.99, 10, 'https://m.media-amazon.com/images/I/61bhVzSmQ1L._AC_SL1500_.jpg'),
  (74, 'Hyper 212 Black Edition', 'Cooler Master', 'COOLER',  44.99,  4, 'https://m.media-amazon.com/images/I/71DqXzQyB1L._AC_SL1500_.jpg'),
  (75, 'Liquid Freezer III 360',  'Arctic',        'COOLER', 119.99, 10, 'https://m.media-amazon.com/images/I/81qd+H-W6mL._AC_SL1500_.jpg');

INSERT IGNORE INTO cooler_details (component_id, cooler_type, fan_size_mm, max_tdp, supported_sockets, noise_level) VALUES
  (70, 'Air',        140, 220, 'AM4, AM5, LGA1700, LGA1200', 24),
  (71, 'Air',        120, 150, 'AM4, AM5, LGA1700, LGA1200', 22),
  (72, 'AIO Liquid', 120, 300, 'AM4, AM5, LGA1700',          36),
  (73, 'AIO Liquid', 120, 240, 'AM4, AM5, LGA1700',          34),
  (74, 'Air',        120, 150, 'AM4, AM5, LGA1700, LGA1200', 26),
  (75, 'AIO Liquid', 120, 360, 'AM4, AM5, LGA1700, LGA1200', 32);
