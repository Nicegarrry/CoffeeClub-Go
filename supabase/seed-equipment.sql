-- CoffeeClub Equipment Catalog Seed Data
-- ~150 items across 7 categories

-- Grinders (~30 items)
INSERT INTO public.equipment_catalog (type, brand, model, detail, grind_range, popularity_rank) VALUES
('grinder', 'Comandante', 'C40 MK4', 'Hand grinder, conical burrs', '0-40 clicks', 1),
('grinder', '1Zpresso', 'JX-Pro', 'Hand grinder, conical burrs, 48mm', '0-40 clicks', 2),
('grinder', '1Zpresso', 'J-Max', 'Hand grinder, conical burrs, 48mm', '0-90 clicks', 3),
('grinder', '1Zpresso', 'K-Max', 'Hand grinder, conical burrs, 48mm', '0-90 clicks', 4),
('grinder', '1Zpresso', 'Q2', 'Hand grinder, conical burrs, 38mm', '0-40 clicks', 5),
('grinder', 'Niche', 'Zero', 'Electric, conical 63mm burrs', '0-50', 6),
('grinder', 'Fellow', 'Ode Gen 2', 'Electric, flat 64mm SSP burrs', '1-11', 7),
('grinder', 'Baratza', 'Encore ESP', 'Electric, conical 40mm burrs', '1-40', 8),
('grinder', 'Baratza', 'Virtuoso+', 'Electric, conical 40mm burrs', '1-40', 9),
('grinder', 'Baratza', 'Sette 270Wi', 'Electric, conical burrs, weight-based dosing', '1-31', 10),
('grinder', 'DF64', 'Gen 2', 'Electric, flat 64mm burrs, single dose', '0-90', 11),
('grinder', 'Eureka', 'Mignon Specialita', 'Electric, flat 55mm burrs', '1-18', 12),
('grinder', 'Eureka', 'Mignon Single Dose', 'Electric, flat 65mm burrs', '1-18', 13),
('grinder', 'Mazzer', 'Mini', 'Electric, flat 64mm burrs', '1-40', 14),
('grinder', 'Weber Workshops', 'EG-1', 'Electric, flat 80mm burrs, ultra-premium', '0-80', 15),
('grinder', 'Option-O', 'Lagom P64', 'Electric, flat 64mm burrs', '0-60', 16),
('grinder', 'Option-O', 'Lagom P100', 'Electric, flat 98mm burrs', '0-60', 17),
('grinder', 'Timemore', 'C2', 'Hand grinder, conical burrs, budget', '0-24 clicks', 18),
('grinder', 'Timemore', 'Chestnut X', 'Hand grinder, conical burrs, premium', '0-36 clicks', 19),
('grinder', 'Hario', 'Skerton Pro', 'Hand grinder, conical ceramic burrs', '1-15 clicks', 20),
('grinder', 'Wilfa', 'Svart', 'Electric, conical burrs, filter focused', '1-40', 21),
('grinder', 'OXO', 'Brew', 'Electric, conical burrs, 15 settings', '1-15', 22),
('grinder', 'Breville', 'Smart Grinder Pro', 'Electric, conical burrs, 60 settings', '1-60', 23),
('grinder', 'Comandante', 'Red Clix', 'Accessory upgrade for C40, finer steps', '0-80 clicks', 24),
('grinder', 'Turin', 'DF83', 'Electric, flat 83mm burrs, single dose', '0-90', 25),
('grinder', 'MiiCoffee', 'DF83 V2', 'Electric, flat 83mm burrs, single dose', '0-90', 26),
('grinder', 'Kingrinder', 'K6', 'Hand grinder, conical burrs, 48mm', '0-40 clicks', 27),
('grinder', 'Varia', 'VS3 Gen 2', 'Electric, flat burrs, multi-purpose', '1-40', 28),
('grinder', 'Option-O', 'Lagom Mini', 'Electric, flat 48mm burrs, compact', '0-50', 29),
('grinder', 'Kinu', 'M47', 'Hand grinder, conical burrs, premium build', '0-55 clicks', 30);

-- Espresso Machines (~25 items)
INSERT INTO public.equipment_catalog (type, brand, model, detail, grind_range, popularity_rank) VALUES
('espresso_machine', 'Breville', 'Bambino', 'Semi-automatic, thermojet, compact', NULL, 1),
('espresso_machine', 'Breville', 'Bambino Plus', 'Semi-automatic, thermojet, auto milk', NULL, 2),
('espresso_machine', 'Breville', 'Barista Express', 'Semi-automatic, built-in grinder', NULL, 3),
('espresso_machine', 'Breville', 'Dual Boiler', 'Semi-automatic, dual boiler, PID', NULL, 4),
('espresso_machine', 'Breville', 'Barista Touch', 'Semi-automatic, touchscreen, auto milk', NULL, 5),
('espresso_machine', 'Decent', 'DE1', 'Smart espresso, pressure/flow profiling', NULL, 6),
('espresso_machine', 'Decent', 'DE1+', 'Smart espresso, pressure/flow profiling, Bluetooth', NULL, 7),
('espresso_machine', 'Decent', 'DE1XL', 'Smart espresso, larger water tank', NULL, 8),
('espresso_machine', 'Gaggia', 'Classic Pro', 'Semi-automatic, single boiler, 58mm', NULL, 9),
('espresso_machine', 'Rancilio', 'Silvia', 'Semi-automatic, single boiler, iron frame', NULL, 10),
('espresso_machine', 'Rancilio', 'Silvia Pro X', 'Semi-automatic, dual boiler, PID', NULL, 11),
('espresso_machine', 'La Marzocco', 'Linea Mini', 'Semi-automatic, dual boiler, commercial grade', NULL, 12),
('espresso_machine', 'La Marzocco', 'GS3', 'Semi-automatic, dual boiler, paddle or AV', NULL, 13),
('espresso_machine', 'Flair', '58', 'Manual lever, 58mm portafilter', NULL, 14),
('espresso_machine', 'Flair', '58x', 'Manual lever, 58mm, pressure gauge', NULL, 15),
('espresso_machine', 'Flair', 'Pro 2', 'Manual lever, bottomless portafilter', NULL, 16),
('espresso_machine', 'Flair', 'Neo', 'Manual lever, pressurized basket, entry-level', NULL, 17),
('espresso_machine', 'Cafelat', 'Robot', 'Manual lever, no electricity needed', NULL, 18),
('espresso_machine', 'Rok', 'EspressoGC', 'Manual lever, glass composite', NULL, 19),
('espresso_machine', 'Lelit', 'Bianca', 'Semi-automatic, dual boiler, flow control paddle', NULL, 20),
('espresso_machine', 'Profitec', 'Pro 600', 'Semi-automatic, dual boiler, PID', NULL, 21),
('espresso_machine', 'ECM', 'Synchronika', 'Semi-automatic, dual boiler, rotary pump', NULL, 22),
('espresso_machine', 'Breville', 'Infuser', 'Semi-automatic, thermocoil, PID', NULL, 23),
('espresso_machine', 'Nuova Simonelli', 'Oscar II', 'Semi-automatic, heat exchanger', NULL, 24),
('espresso_machine', 'Ascaso', 'Dream PID', 'Semi-automatic, thermoblock, PID', NULL, 25);

-- Pour-Over (~15 items)
INSERT INTO public.equipment_catalog (type, brand, model, detail, grind_range, popularity_rank) VALUES
('pour_over', 'Hario', 'V60 01', 'Ceramic, 1-2 cups, cone dripper', NULL, 1),
('pour_over', 'Hario', 'V60 02', 'Ceramic/plastic, 1-4 cups, cone dripper', NULL, 2),
('pour_over', 'Hario', 'V60 03', 'Ceramic, 1-6 cups, cone dripper', NULL, 3),
('pour_over', 'Kalita', 'Wave 155', 'Stainless steel, flat bottom, 1-2 cups', NULL, 4),
('pour_over', 'Kalita', 'Wave 185', 'Stainless steel, flat bottom, 2-4 cups', NULL, 5),
('pour_over', 'Origami', 'Dripper', 'Ceramic, works with V60 and Wave filters', NULL, 6),
('pour_over', 'Fellow', 'Stagg [X]', 'Double wall, vacuum insulated, cone', NULL, 7),
('pour_over', 'Fellow', 'Stagg [XF]', 'Flat bottom, double wall insulated', NULL, 8),
('pour_over', 'Chemex', '6-Cup', 'Glass, thick paper filter, clean cup', NULL, 9),
('pour_over', 'Chemex', '8-Cup', 'Glass, thick paper filter, clean cup', NULL, 10),
('pour_over', 'December', 'Dripper', 'Adjustable flow rate, stainless steel', NULL, 11),
('pour_over', 'Melodrip', 'Melodrip', 'Accessory for even water distribution', NULL, 12),
('pour_over', 'Orea', 'V3', 'Brewer, flat bottom, negotiable flow', NULL, 13),
('pour_over', 'Tricolate', 'Tricolate', 'Full immersion pour-over, no agitation', NULL, 14),
('pour_over', 'April', 'Brewer', 'Plastic, flat bottom, Danish design', NULL, 15);

-- Immersion (~10 items)
INSERT INTO public.equipment_catalog (type, brand, model, detail, grind_range, popularity_rank) VALUES
('immersion', 'AeroPress', 'Original', 'Pressure immersion brewer, versatile', NULL, 1),
('immersion', 'AeroPress', 'Go', 'Compact travel version, built-in mug', NULL, 2),
('immersion', 'AeroPress', 'Clear', 'Tritan plastic, transparent body', NULL, 3),
('immersion', 'AeroPress', 'XL', 'Large capacity, makes up to 3 servings', NULL, 4),
('immersion', 'Clever', 'Dripper', 'Immersion dripper with shutoff valve', NULL, 5),
('immersion', 'Hario', 'Switch', 'V60 with immersion valve, hybrid brewer', NULL, 6),
('immersion', 'Bodum', 'Chambord', 'French press, stainless steel frame', NULL, 7),
('immersion', 'Fellow', 'Clara', 'French press, enhanced filtration', NULL, 8),
('immersion', 'Espro', 'P7', 'French press, double micro-filter', NULL, 9),
('immersion', 'Delter', 'Coffee Press', 'Jet injection brewer, low agitation', NULL, 10);

-- Kettles (~10 items)
INSERT INTO public.equipment_catalog (type, brand, model, detail, grind_range, popularity_rank) VALUES
('kettle', 'Fellow', 'Stagg EKG', 'Electric gooseneck, variable temp, PID', NULL, 1),
('kettle', 'Fellow', 'Stagg EKG Pro', 'Electric gooseneck, Bluetooth, studio edition', NULL, 2),
('kettle', 'Hario', 'Buono', 'Stovetop gooseneck, stainless steel', NULL, 3),
('kettle', 'Bonavita', 'Variable Temp', 'Electric gooseneck, hold temp, 1L', NULL, 4),
('kettle', 'Timemore', 'Fish Smart', 'Electric gooseneck, variable temp', NULL, 5),
('kettle', 'Brewista', 'Artisan', 'Electric gooseneck, variable temp, 600ml/1L', NULL, 6),
('kettle', 'OXO', 'Adjustable Temp', 'Electric gooseneck, built-in timer', NULL, 7),
('kettle', 'Cosori', 'Gooseneck Kettle', 'Electric gooseneck, 5 presets, budget', NULL, 8),
('kettle', 'Fellow', 'Corvo EKG', 'Electric gooseneck, mini 600ml', NULL, 9),
('kettle', 'Matinee', 'Gooseneck Kettle', 'Electric gooseneck, minimalist design', NULL, 10);

-- Scales (~10 items)
INSERT INTO public.equipment_catalog (type, brand, model, detail, grind_range, popularity_rank) VALUES
('scale', 'Acaia', 'Pearl', 'Smart scale, Bluetooth, auto-timer', NULL, 1),
('scale', 'Acaia', 'Pearl S', 'Smart scale, Bluetooth, slim profile', NULL, 2),
('scale', 'Acaia', 'Lunar', 'Smart espresso scale, fits drip tray', NULL, 3),
('scale', 'Timemore', 'Black Mirror Basic+', 'Auto-timer, LED display, 0.1g accuracy', NULL, 4),
('scale', 'Timemore', 'Black Mirror Nano', 'Compact, USB-C, 0.1g accuracy', NULL, 5),
('scale', 'Fellow', 'Tally', 'Pro studio scale, Bluetooth, rechargeable', NULL, 6),
('scale', 'Hario', 'V60 Drip Scale', 'Built-in timer, 0.1g accuracy', NULL, 7),
('scale', 'Decent', 'Scale', 'Smart scale, fast response, Bluetooth', NULL, 8),
('scale', 'Felicita', 'Arc', 'Smart scale, Bluetooth, auto-timer', NULL, 9),
('scale', 'Brewista', 'Smart Scale II', 'Bluetooth, auto-modes, waterproof', NULL, 10);

-- Accessories (~10 items)
INSERT INTO public.equipment_catalog (type, brand, model, detail, grind_range, popularity_rank) VALUES
('accessory', 'Generic', 'WDT Tool', 'Weiss Distribution Technique tool', NULL, 1),
('accessory', 'Normcore', 'V4 Tamper', 'Spring-loaded tamper, self-leveling', NULL, 2),
('accessory', 'Pullman', 'BigStep Tamper', 'Precision tamper, minimal gap', NULL, 3),
('accessory', 'Acaia', 'Dosing Cup', 'Stainless steel, fits 58mm portafilter', NULL, 4),
('accessory', 'Decent', 'Puck Screen', 'Reusable mesh, even water distribution', NULL, 5),
('accessory', 'IMS', 'Precision Basket', 'Competition filter basket, uniform holes', NULL, 6),
('accessory', 'Fellow', 'Atmos Canister', 'Vacuum sealed coffee storage', NULL, 7),
('accessory', 'Airscape', 'Canister', 'Inner lid pushes out air, stainless steel', NULL, 8),
('accessory', 'Acaia', 'Portafilter Funnel', 'Dosing funnel, reduces mess', NULL, 9),
('accessory', 'BPlus', 'Sifter', 'Removes coffee fines for cleaner extraction', NULL, 10);
