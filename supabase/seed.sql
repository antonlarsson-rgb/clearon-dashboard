-- ClearOn Intelligence: Seed data
-- 50 accounts, 200 contacts, lead scores, product scores, campaigns, etc.

-- ============================================================
-- ACCOUNTS (50 Swedish companies)
-- ============================================================
INSERT INTO accounts (id, upsales_id, name, industry, size, website) VALUES
('a0000001-0000-0000-0000-000000000001', 1001, 'Fazer', 'FMCG', '1000+', 'fazer.se'),
('a0000001-0000-0000-0000-000000000002', 1002, 'Orkla', 'FMCG', '500-999', 'orkla.se'),
('a0000001-0000-0000-0000-000000000003', 1003, 'ICA', 'Dagligvaruhandel', '1000+', 'ica.se'),
('a0000001-0000-0000-0000-000000000004', 1004, 'Lantmannen', 'FMCG', '1000+', 'lantmannen.se'),
('a0000001-0000-0000-0000-000000000005', 1005, 'Volvo Cars', 'Fordon', '1000+', 'volvocars.se'),
('a0000001-0000-0000-0000-000000000006', 1006, 'Telia', 'Telekom', '1000+', 'telia.se'),
('a0000001-0000-0000-0000-000000000007', 1007, 'Axfood', 'Dagligvaruhandel', '1000+', 'axfood.se'),
('a0000001-0000-0000-0000-000000000008', 1008, 'Arla', 'FMCG', '1000+', 'arla.se'),
('a0000001-0000-0000-0000-000000000009', 1009, 'Coop', 'Dagligvaruhandel', '1000+', 'coop.se'),
('a0000001-0000-0000-0000-000000000010', 1010, 'Unilever Nordics', 'FMCG', '500-999', 'unilever.se'),
('a0000001-0000-0000-0000-000000000011', 1011, 'Procter & Gamble', 'FMCG', '1000+', 'pg.com'),
('a0000001-0000-0000-0000-000000000012', 1012, 'Nestle Nordics', 'FMCG', '1000+', 'nestle.se'),
('a0000001-0000-0000-0000-000000000013', 1013, 'H&M', 'Retail', '1000+', 'hm.com'),
('a0000001-0000-0000-0000-000000000014', 1014, 'IKEA', 'Retail', '1000+', 'ikea.se'),
('a0000001-0000-0000-0000-000000000015', 1015, 'Stadium', 'Retail', '500-999', 'stadium.se'),
('a0000001-0000-0000-0000-000000000016', 1016, 'Systembolaget', 'Dagligvaruhandel', '1000+', 'systembolaget.se'),
('a0000001-0000-0000-0000-000000000017', 1017, 'Mondelez', 'FMCG', '500-999', 'mondelez.se'),
('a0000001-0000-0000-0000-000000000018', 1018, 'Reckitt Nordic', 'FMCG', '200-499', 'reckitt.com'),
('a0000001-0000-0000-0000-000000000019', 1019, 'Scandic Hotels', 'Hospitality', '1000+', 'scandichotels.se'),
('a0000001-0000-0000-0000-000000000020', 1020, 'SAS', 'Transport', '1000+', 'sas.se'),
('a0000001-0000-0000-0000-000000000021', 1021, 'Electrolux', 'Elektronik', '1000+', 'electrolux.se'),
('a0000001-0000-0000-0000-000000000022', 1022, 'Essity', 'FMCG', '1000+', 'essity.se'),
('a0000001-0000-0000-0000-000000000023', 1023, 'Husqvarna', 'Industri', '1000+', 'husqvarna.se'),
('a0000001-0000-0000-0000-000000000024', 1024, 'Vattenfall', 'Energi', '1000+', 'vattenfall.se'),
('a0000001-0000-0000-0000-000000000025', 1025, 'Klarna', 'Fintech', '1000+', 'klarna.com'),
('a0000001-0000-0000-0000-000000000026', 1026, 'Spotify', 'Tech', '1000+', 'spotify.com'),
('a0000001-0000-0000-0000-000000000027', 1027, 'Oatly', 'FMCG', '200-499', 'oatly.com'),
('a0000001-0000-0000-0000-000000000028', 1028, 'Paulig', 'FMCG', '200-499', 'paulig.se'),
('a0000001-0000-0000-0000-000000000029', 1029, 'Duni', 'FMCG', '200-499', 'duni.com'),
('a0000001-0000-0000-0000-000000000030', 1030, 'Santa Maria', 'FMCG', '200-499', 'santamaria.se'),
('a0000001-0000-0000-0000-000000000031', 1031, 'Findus', 'FMCG', '200-499', 'findus.se'),
('a0000001-0000-0000-0000-000000000032', 1032, 'Abba Seafood', 'FMCG', '200-499', 'abbaseafood.se'),
('a0000001-0000-0000-0000-000000000033', 1033, 'Felix', 'FMCG', '200-499', 'felix.se'),
('a0000001-0000-0000-0000-000000000034', 1034, 'Hemkop', 'Dagligvaruhandel', '500-999', 'hemkop.se'),
('a0000001-0000-0000-0000-000000000035', 1035, 'Willys', 'Dagligvaruhandel', '1000+', 'willys.se'),
('a0000001-0000-0000-0000-000000000036', 1036, 'Lidl Sverige', 'Dagligvaruhandel', '500-999', 'lidl.se'),
('a0000001-0000-0000-0000-000000000037', 1037, 'Biltema', 'Retail', '500-999', 'biltema.se'),
('a0000001-0000-0000-0000-000000000038', 1038, 'Bauhaus', 'Retail', '500-999', 'bauhaus.se'),
('a0000001-0000-0000-0000-000000000039', 1039, 'Elgiganten', 'Elektronik', '1000+', 'elgiganten.se'),
('a0000001-0000-0000-0000-000000000040', 1040, 'NetOnNet', 'Elektronik', '200-499', 'netonnet.se'),
('a0000001-0000-0000-0000-000000000041', 1041, 'Polarn O. Pyret', 'Retail', '200-499', 'polarnopyret.se'),
('a0000001-0000-0000-0000-000000000042', 1042, 'Lindex', 'Retail', '500-999', 'lindex.com'),
('a0000001-0000-0000-0000-000000000043', 1043, 'KappAhl', 'Retail', '500-999', 'kappahl.com'),
('a0000001-0000-0000-0000-000000000044', 1044, 'Nordic Choice', 'Hospitality', '1000+', 'nordicchoice.se'),
('a0000001-0000-0000-0000-000000000045', 1045, 'Atria Nordic', 'FMCG', '200-499', 'atria.se'),
('a0000001-0000-0000-0000-000000000046', 1046, 'Spendrups', 'FMCG', '200-499', 'spendrups.se'),
('a0000001-0000-0000-0000-000000000047', 1047, 'Kopparbergs', 'FMCG', '200-499', 'kopparbergs.se'),
('a0000001-0000-0000-0000-000000000048', 1048, 'Dagrofa', 'Dagligvaruhandel', '500-999', 'dagrofa.se'),
('a0000001-0000-0000-0000-000000000049', 1049, 'Martin & Servera', 'Dagligvaruhandel', '1000+', 'martinservera.se'),
('a0000001-0000-0000-0000-000000000050', 1050, 'Menigo', 'Dagligvaruhandel', '500-999', 'menigo.se');

-- ============================================================
-- CONTACTS (key contacts for top accounts, ~20 detailed + extras)
-- We insert without reports_to first, then update hierarchy
-- ============================================================

-- Fazer contacts
INSERT INTO contacts (id, upsales_id, account_id, name, title, email, phone, role_category, linkedin_url) VALUES
('c0000001-0000-0000-0000-000000000001', 2001, 'a0000001-0000-0000-0000-000000000001', 'Maria Eriksson', 'Brand Manager', 'maria.eriksson@fazer.se', '+46 70 123 4567', 'marketing', 'linkedin.com/in/mariaeriksson'),
('c0000001-0000-0000-0000-000000000002', 2002, 'a0000001-0000-0000-0000-000000000001', 'Anders Johansson', 'CMO', 'anders.johansson@fazer.se', '+46 70 234 5678', 'executive', 'linkedin.com/in/andersjohansson'),
('c0000001-0000-0000-0000-000000000003', 2003, 'a0000001-0000-0000-0000-000000000001', 'Erik Lind', 'Trade Marketing Manager', 'erik.lind@fazer.se', '+46 70 345 6789', 'trade_marketing', 'linkedin.com/in/eriklind'),
('c0000001-0000-0000-0000-000000000004', 2004, 'a0000001-0000-0000-0000-000000000001', 'Sofia Holm', 'Digital Marketing Specialist', 'sofia.holm@fazer.se', '+46 70 456 7890', 'marketing', 'linkedin.com/in/sofiaholm');

-- Volvo Cars contacts
INSERT INTO contacts (id, upsales_id, account_id, name, title, email, phone, role_category, linkedin_url) VALUES
('c0000001-0000-0000-0000-000000000005', 2005, 'a0000001-0000-0000-0000-000000000005', 'Johan Lindstrom', 'HR-chef', 'johan.lindstrom@volvocars.com', '+46 70 567 8901', 'hr', 'linkedin.com/in/johanlindstrom'),
('c0000001-0000-0000-0000-000000000015', 2015, 'a0000001-0000-0000-0000-000000000005', 'Anna Svensson', 'Inkopschef', 'anna.s@volvocars.com', '+46 70 555 6677', 'other', 'linkedin.com/in/annasvensson2');

-- Orkla contacts
INSERT INTO contacts (id, upsales_id, account_id, name, title, email, phone, role_category, linkedin_url) VALUES
('c0000001-0000-0000-0000-000000000006', 2006, 'a0000001-0000-0000-0000-000000000002', 'Anna Svensson', 'Trade Marketing Manager', 'anna.svensson@orkla.se', '+46 70 678 9012', 'trade_marketing', 'linkedin.com/in/annasvensson'),
('c0000001-0000-0000-0000-000000000007', 2007, 'a0000001-0000-0000-0000-000000000002', 'Henrik Dahl', 'Marketing Director', 'henrik.dahl@orkla.se', '+46 70 789 0123', 'executive', 'linkedin.com/in/henrikdahl');

-- Lantmannen, Telia, ICA, Axfood, Arla, Coop, Unilever, P&G, Nestle, H&M, Scandic, Mondelez
INSERT INTO contacts (id, upsales_id, account_id, name, title, email, phone, role_category, linkedin_url) VALUES
('c0000001-0000-0000-0000-000000000008', 2008, 'a0000001-0000-0000-0000-000000000004', 'Per Nilsson', 'Marknadschef', 'per.nilsson@lantmannen.se', '+46 70 890 1234', 'marketing', 'linkedin.com/in/pernilsson'),
('c0000001-0000-0000-0000-000000000009', 2009, 'a0000001-0000-0000-0000-000000000006', 'Sara Bergstrom', 'Kundtjanstchef', 'sara.bergstrom@telia.se', '+46 70 901 2345', 'customer_service', 'linkedin.com/in/sarabergstrom'),
('c0000001-0000-0000-0000-000000000010', 2010, 'a0000001-0000-0000-0000-000000000003', 'Lars Pettersson', 'Category Manager', 'lars.pettersson@ica.se', '+46 70 012 3456', 'trade_marketing', 'linkedin.com/in/larspettersson'),
('c0000001-0000-0000-0000-000000000011', 2011, 'a0000001-0000-0000-0000-000000000007', 'Karin Lundgren', 'Brand Manager', 'karin.lundgren@axfood.se', '+46 70 111 2233', 'marketing', 'linkedin.com/in/karinlundgren'),
('c0000001-0000-0000-0000-000000000012', 2012, 'a0000001-0000-0000-0000-000000000008', 'Oskar Berg', 'Trade Marketing Specialist', 'oskar.berg@arla.se', '+46 70 222 3344', 'trade_marketing', 'linkedin.com/in/oskarberg'),
('c0000001-0000-0000-0000-000000000013', 2013, 'a0000001-0000-0000-0000-000000000010', 'Emma Franzen', 'Shopper Marketing Manager', 'emma.franzen@unilever.com', '+46 70 333 4455', 'marketing', 'linkedin.com/in/emmafranzen'),
('c0000001-0000-0000-0000-000000000014', 2014, 'a0000001-0000-0000-0000-000000000009', 'David Nordin', 'Marknadschef', 'david.nordin@coop.se', '+46 70 444 5566', 'marketing', 'linkedin.com/in/davidnordin'),
('c0000001-0000-0000-0000-000000000016', 2016, 'a0000001-0000-0000-0000-000000000011', 'Therese Aberg', 'Brand Manager', 'therese.aberg@pg.com', '+46 70 666 7788', 'marketing', 'linkedin.com/in/thereseaberg'),
('c0000001-0000-0000-0000-000000000017', 2017, 'a0000001-0000-0000-0000-000000000012', 'Fredrik Ek', 'Marketing Manager', 'fredrik.ek@nestle.se', '+46 70 777 8899', 'marketing', 'linkedin.com/in/fredrikek'),
('c0000001-0000-0000-0000-000000000018', 2018, 'a0000001-0000-0000-0000-000000000013', 'Louise Sjoberg', 'CRM Manager', 'louise.sjoberg@hm.com', '+46 70 888 9900', 'marketing', 'linkedin.com/in/louisesjoberg'),
('c0000001-0000-0000-0000-000000000019', 2019, 'a0000001-0000-0000-0000-000000000019', 'Marcus Wahl', 'HR-direktor', 'marcus.wahl@scandichotels.com', '+46 70 999 0011', 'hr', 'linkedin.com/in/marcuswahl'),
('c0000001-0000-0000-0000-000000000020', 2020, 'a0000001-0000-0000-0000-000000000017', 'Ida Karlsson', 'Shopper Marketing Lead', 'ida.karlsson@mondelez.com', '+46 70 100 2233', 'marketing', 'linkedin.com/in/idakarlsson');

-- Set hierarchy for Fazer
UPDATE contacts SET reports_to_contact_id = 'c0000001-0000-0000-0000-000000000002' WHERE id IN ('c0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003');
UPDATE contacts SET reports_to_contact_id = 'c0000001-0000-0000-0000-000000000001' WHERE id = 'c0000001-0000-0000-0000-000000000004';

-- Set hierarchy for Orkla
UPDATE contacts SET reports_to_contact_id = 'c0000001-0000-0000-0000-000000000007' WHERE id = 'c0000001-0000-0000-0000-000000000006';

-- ============================================================
-- LEAD SCORES
-- ============================================================
INSERT INTO lead_scores (contact_id, total_score, engagement_score, fit_score, intent_score, signals) VALUES
('c0000001-0000-0000-0000-000000000001', 87, 36, 25, 26, '[{"type":"page_view","value":8,"timestamp":"2026-04-16T14:30:00Z","description":"Besokte /sales-promotion/ (3 ggr)"},{"type":"download","value":10,"timestamp":"2026-04-17T09:42:00Z","description":"Laddade ner Clear Insights-rapport"},{"type":"email_click","value":6,"timestamp":"2026-04-14T11:20:00Z","description":"Klickade pa Boka demo-lank"},{"type":"email_open","value":3,"timestamp":"2026-04-15T08:15:00Z","description":"Oppnade Kupongkampanjer 2026"},{"type":"search","value":5,"timestamp":"2026-04-12T16:00:00Z","description":"Forsta besok via Google kupongkampanj butik"}]'),
('c0000001-0000-0000-0000-000000000005', 74, 28, 22, 24, '[{"type":"page_view","value":8,"timestamp":"2026-04-17T10:15:00Z","description":"Besokte /send-a-gift/ (2 ggr)"},{"type":"search","value":5,"timestamp":"2026-04-17T10:10:00Z","description":"Google: digital personalbeloning"}]'),
('c0000001-0000-0000-0000-000000000006', 71, 26, 25, 20, '[{"type":"ad_click","value":4,"timestamp":"2026-04-16T15:30:00Z","description":"Klickade pa LinkedIn-annons Gamification"},{"type":"page_view","value":8,"timestamp":"2026-04-16T15:32:00Z","description":"Besokte /interactive-engage/"}]'),
('c0000001-0000-0000-0000-000000000008', 68, 24, 24, 20, '[{"type":"email_open","value":9,"timestamp":"2026-04-17T08:30:00Z","description":"Oppnade 3 mail i rad denna vecka"}]'),
('c0000001-0000-0000-0000-000000000009', 65, 22, 20, 23, '[{"type":"page_view","value":10,"timestamp":"2026-04-17T09:28:00Z","description":"Besokte kontaktsidan"},{"type":"page_view","value":8,"timestamp":"2026-04-17T09:25:00Z","description":"Besokte /customer-care/"}]'),
('c0000001-0000-0000-0000-000000000010', 62, 20, 25, 17, '[]'),
('c0000001-0000-0000-0000-000000000020', 61, 19, 24, 18, '[]'),
('c0000001-0000-0000-0000-000000000011', 58, 18, 25, 15, '[]'),
('c0000001-0000-0000-0000-000000000012', 55, 17, 23, 15, '[]'),
('c0000001-0000-0000-0000-000000000013', 52, 16, 22, 14, '[]'),
('c0000001-0000-0000-0000-000000000014', 48, 14, 20, 14, '[]'),
('c0000001-0000-0000-0000-000000000016', 45, 13, 22, 10, '[]'),
('c0000001-0000-0000-0000-000000000017', 43, 12, 21, 10, '[]'),
('c0000001-0000-0000-0000-000000000003', 42, 12, 20, 10, '[]'),
('c0000001-0000-0000-0000-000000000015', 40, 12, 18, 10, '[]'),
('c0000001-0000-0000-0000-000000000018', 38, 10, 18, 10, '[]'),
('c0000001-0000-0000-0000-000000000019', 35, 10, 15, 10, '[]'),
('c0000001-0000-0000-0000-000000000004', 33, 10, 15, 8, '[]'),
('c0000001-0000-0000-0000-000000000002', 30, 8, 15, 7, '[]'),
('c0000001-0000-0000-0000-000000000007', 28, 6, 15, 7, '[]');

-- ============================================================
-- PRODUCT SCORES
-- ============================================================
INSERT INTO product_scores (contact_id, product_slug, score) VALUES
('c0000001-0000-0000-0000-000000000001', 'sales-promotion', 82),
('c0000001-0000-0000-0000-000000000001', 'interactive-engage', 34),
('c0000001-0000-0000-0000-000000000001', 'customer-care', 12),
('c0000001-0000-0000-0000-000000000005', 'send-a-gift', 76),
('c0000001-0000-0000-0000-000000000005', 'customer-care', 18),
('c0000001-0000-0000-0000-000000000006', 'interactive-engage', 71),
('c0000001-0000-0000-0000-000000000006', 'sales-promotion', 22),
('c0000001-0000-0000-0000-000000000008', 'sales-promotion', 64),
('c0000001-0000-0000-0000-000000000008', 'kampanja', 28),
('c0000001-0000-0000-0000-000000000009', 'customer-care', 68),
('c0000001-0000-0000-0000-000000000009', 'send-a-gift', 15),
('c0000001-0000-0000-0000-000000000010', 'sales-promotion', 58),
('c0000001-0000-0000-0000-000000000011', 'sales-promotion', 52),
('c0000001-0000-0000-0000-000000000012', 'sales-promotion', 48),
('c0000001-0000-0000-0000-000000000013', 'interactive-engage', 44),
('c0000001-0000-0000-0000-000000000014', 'kampanja', 42),
('c0000001-0000-0000-0000-000000000016', 'sales-promotion', 40),
('c0000001-0000-0000-0000-000000000017', 'sales-promotion', 38),
('c0000001-0000-0000-0000-000000000018', 'customer-care', 30),
('c0000001-0000-0000-0000-000000000019', 'send-a-gift', 62),
('c0000001-0000-0000-0000-000000000020', 'interactive-engage', 56);

-- ============================================================
-- AD CAMPAIGNS
-- ============================================================
INSERT INTO ad_campaigns (platform, campaign_name, product_slug, status, budget, spend, impressions, clicks, leads_generated, conversions, date) VALUES
('meta', 'Kupongguiden 2026', 'sales-promotion', 'active', 25000, 18400, 245000, 3200, 34, 4, '2026-04-17'),
('meta', 'Send a Gift HR', 'send-a-gift', 'active', 15000, 8900, 128000, 1800, 18, 2, '2026-04-17'),
('google', 'Kupongkampanj butik', 'sales-promotion', 'active', 20000, 14200, 89000, 2100, 22, 3, '2026-04-17'),
('google', 'Personalbeloning digital', 'send-a-gift', 'active', 12000, 7600, 56000, 980, 12, 1, '2026-04-17'),
('linkedin', 'Gamification retail', 'interactive-engage', 'active', 18000, 12300, 67000, 890, 8, 1, '2026-04-17'),
('linkedin', 'Customer Care B2B', 'customer-care', 'paused', 10000, 10000, 82000, 1100, 11, 2, '2026-04-10'),
('meta', 'Kampanja lansering', 'kampanja', 'active', 8000, 3200, 45000, 620, 6, 0, '2026-04-17'),
('google', 'Clearing kedjor', 'clearing-solutions', 'active', 5000, 2800, 22000, 340, 4, 0, '2026-04-17');

-- ============================================================
-- CLICKUP TASKS
-- ============================================================
INSERT INTO clickup_tasks (clickup_id, name, description, status, assignee, priority, due_date, date_created, date_updated, date_closed, list_name, folder_name) VALUES
('cu_task_001', 'Landningssida Kampanja', 'Bygg landningssida for Kampanja-tjansten pa clearon.live/kampanja', 'done', 'Anton Larsson', 2, '2026-04-14', '2026-03-20', '2026-04-14', '2026-04-14', 'Webb', 'ClearOn'),
('cu_task_002', 'Meta A/B-test Kupongguiden', 'Kor A/B-test pa Meta-kampanjen for Kupongguiden', 'done', 'Kaveh Sabeghi', 2, '2026-04-15', '2026-03-25', '2026-04-15', '2026-04-15', 'Annonsering', 'ClearOn'),
('cu_task_003', 'SEO-audit clearon.se', 'Genomfor SEO-audit och leverera rapport', 'done', 'Anton Larsson', 3, '2026-04-16', '2026-04-01', '2026-04-16', '2026-04-16', 'SEO', 'ClearOn'),
('cu_task_004', 'Bloggartiklar (3 st)', 'Skriv och publicera 3 artiklar om kupongkampanjer', 'done', 'Anton Larsson', 3, '2026-04-16', '2026-04-05', '2026-04-16', '2026-04-16', 'Content', 'ClearOn'),
('cu_task_005', 'Google Ads Send a Gift', 'Lansera Google Ads-kampanj for Send a Gift', 'in progress', 'Kaveh Sabeghi', 2, '2026-04-21', '2026-04-10', '2026-04-17', NULL, 'Annonsering', 'ClearOn'),
('cu_task_006', 'Design Interactive Engage-sidan', 'Nytt designkoncept for Interactive Engage-sidan', 'in progress', 'Anton Larsson', 2, '2026-04-22', '2026-04-12', '2026-04-17', NULL, 'Webb', 'ClearOn'),
('cu_task_007', 'LinkedIn-kampanj Q2', 'Planera och bygga LinkedIn-kampanj for Q2', 'to do', 'Kaveh Sabeghi', 2, '2026-04-28', '2026-04-15', '2026-04-15', NULL, 'Annonsering', 'ClearOn'),
('cu_task_008', 'Uppdatera ClearOn Event-sida', 'Uppdatera event-sidan med nytt innehall', 'to do', 'Anton Larsson', 3, '2026-04-30', '2026-04-16', '2026-04-16', NULL, 'Webb', 'ClearOn'),
('cu_task_009', 'Email-automation setup', 'Satt upp automatiska mailfloden i Upsales', 'to do', 'Kaveh Sabeghi', 3, '2026-05-02', '2026-04-16', '2026-04-16', NULL, 'CRM', 'ClearOn'),
('cu_task_010', 'Konverteringsoptimering clearon.live', 'Optimera konverteringsflode pa landningssidan', 'in progress', 'Anton Larsson', 1, '2026-04-18', '2026-04-14', '2026-04-17', NULL, 'Webb', 'ClearOn');

-- ============================================================
-- WEEKLY SUMMARIES
-- ============================================================
INSERT INTO weekly_summaries (week_number, year, summary_text, tasks_completed, tasks_in_progress) VALUES
(16, 2026, 'Den har veckan har Stellar slutfort 8 uppgifter for ClearOn. Landningssidan for Kampanja-tjansten ar klar och live pa clearon.live/kampanja. Meta-kampanjens A/B-test har avslutats med variant B som vinnare (+34% CTR). SEO-auditen av clearon.se ar levererad med 47 atgardspunkter. Tre bloggartiklar om kupongkampanjer ar publicerade. Google Ads-kampanjen for Send a Gift ar under uppbyggnad och planeras lanseras mandag. Nytt designkoncept for Interactive Engage-sidan pagar.', 8, 3),
(15, 2026, 'Vecka 15 fokuserade pa innehallsproduktion och annonseringsoptimering. 5 uppgifter slutfordes: ny hero-sektion pa clearon.live, tva kundcase (Orkla, Lantmannen) publicerade, Meta-kampanjens budget justerad (+20%), och tracking-setup for GA4 slutfort. Konverteringsgraden pa clearon.live okade fran 2.1% till 3.4%.', 5, 4),
(14, 2026, 'Stellar paborjade tre nya initiativ: SEO-audit, LinkedIn-annonsering och email-automationsflode. 4 tasks slutfordes: produktsidorna for Sales Promotion och Customer Care uppdaterade, nytt bildbibliotek uppladdat, och Google Ads-kontot restrukturerat. CPL sjonk med 18% totalt.', 4, 5),
(13, 2026, 'Fokus pa teknisk grund. Stellar levererade: ny responsiv design for clearon.live (mobiltrafik +22%), integration med Upsales for automatisk lead-fangst, och Meta Pixel-setup for retargeting. 6 tasks slutforda.', 6, 2);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
INSERT INTO opportunities (upsales_id, account_id, contact_id, stage, value, product_slug, close_date) VALUES
(3001, 'a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'proposal', 450000, 'sales-promotion', '2026-05-15'),
(3002, 'a0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000005', 'meeting', 180000, 'send-a-gift', '2026-05-30'),
(3003, 'a0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000006', 'contacted', 320000, 'interactive-engage', '2026-06-15'),
(3004, 'a0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000010', 'won', 520000, 'sales-promotion', '2026-03-01'),
(3005, 'a0000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000011', 'won', 280000, 'sales-promotion', '2026-02-15'),
(3006, 'a0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000008', 'negotiation', 380000, 'sales-promotion', '2026-05-01'),
(3007, 'a0000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000014', 'meeting', 210000, 'kampanja', '2026-06-01'),
(3008, 'a0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000009', 'contacted', 150000, 'customer-care', '2026-06-30'),
(3009, 'a0000001-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000013', 'proposal', 290000, 'interactive-engage', '2026-05-20'),
(3010, 'a0000001-0000-0000-0000-000000000019', 'c0000001-0000-0000-0000-000000000019', 'new', 95000, 'send-a-gift', '2026-07-01');

-- ============================================================
-- EMAIL EVENTS (sample)
-- ============================================================
INSERT INTO email_events (contact_id, campaign_name, event_type, metadata, timestamp) VALUES
('c0000001-0000-0000-0000-000000000001', 'Kupongkampanjer 2026', 'sent', '{}', '2026-04-10T09:00:00Z'),
('c0000001-0000-0000-0000-000000000001', 'Kupongkampanjer 2026', 'opened', '{}', '2026-04-10T14:22:00Z'),
('c0000001-0000-0000-0000-000000000001', 'Kupongkampanjer 2026', 'clicked', '{"link":"boka-demo"}', '2026-04-14T11:20:00Z'),
('c0000001-0000-0000-0000-000000000001', 'Clear Insights Q2', 'sent', '{}', '2026-04-15T08:00:00Z'),
('c0000001-0000-0000-0000-000000000001', 'Clear Insights Q2', 'opened', '{}', '2026-04-15T08:15:00Z'),
('c0000001-0000-0000-0000-000000000008', 'Kupongkampanjer 2026', 'sent', '{}', '2026-04-10T09:00:00Z'),
('c0000001-0000-0000-0000-000000000008', 'Kupongkampanjer 2026', 'opened', '{}', '2026-04-12T10:30:00Z'),
('c0000001-0000-0000-0000-000000000008', 'Clear Insights Q2', 'sent', '{}', '2026-04-15T08:00:00Z'),
('c0000001-0000-0000-0000-000000000008', 'Clear Insights Q2', 'opened', '{}', '2026-04-15T11:00:00Z'),
('c0000001-0000-0000-0000-000000000008', 'Nyheter april', 'sent', '{}', '2026-04-17T07:00:00Z'),
('c0000001-0000-0000-0000-000000000008', 'Nyheter april', 'opened', '{}', '2026-04-17T08:30:00Z'),
('c0000001-0000-0000-0000-000000000009', 'Customer Care Guide', 'sent', '{}', '2026-04-12T09:00:00Z'),
('c0000001-0000-0000-0000-000000000009', 'Customer Care Guide', 'opened', '{}', '2026-04-12T15:00:00Z'),
('c0000001-0000-0000-0000-000000000005', 'Send a Gift Case Study', 'sent', '{}', '2026-04-14T09:00:00Z'),
('c0000001-0000-0000-0000-000000000005', 'Send a Gift Case Study', 'opened', '{}', '2026-04-14T12:30:00Z');

-- ============================================================
-- AI SUGGESTIONS
-- ============================================================
INSERT INTO ai_suggestions (contact_id, account_id, suggestion_type, category, title, description, value_proposition, priority, status) VALUES
('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'call', 'hot_lead', 'Ring Maria Eriksson pa Fazer', 'Score 87. 3 sidbesok + rapport-nedladdning igar. Chef Anders Johansson (CMO) finns redan i CRM.', 'Potential deal: 450 000 kr', 1, 'pending'),
(NULL, NULL, 'campaign', 'segment', '14 HR-chefer har besökt Send a Gift', 'Senaste 30 dagarna utan att konvertera. Skicka case study-mail.', 'Prognos: 3 moten', 2, 'pending'),
(NULL, NULL, 'budget', 'advertising', 'Oka Meta-budget for Kupongguiden', 'ROAS 6.2x. CPL 89 kr mot budget 120 kr.', 'Beraknad effekt: +14 leads', 2, 'pending'),
(NULL, NULL, 'email', 'sleeping', '23 sovande kunder', '23 befintliga kunder utan aktivitet pa 6+ manader.', 'Historiskt 18% aterenagagemang', 3, 'pending'),
('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'call', 'timing', 'Ring Anna Svensson pa Orkla inom 48h', 'Klickade pa LinkedIn-annonsen for gamification igar. Kollega Erik redan kund.', 'Tidskritiskt: 48h', 1, 'pending');
