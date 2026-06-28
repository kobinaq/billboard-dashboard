begin;

delete from public.inspection_photos
where inspection_id in (
  select id
  from public.inspection_logs
  where notes like '[sample]%'
);

delete from public.inspection_logs
where notes like '[sample]%';

delete from public.payments
where notes like '[sample]%';

delete from public.contracts
where notes like '[sample]%';

delete from public.clients
where notes like '[sample]%';

delete from public.billboards
where notes like '[sample]%';

insert into public.regions (name)
values
  ('Northern'),
  ('Volta'),
  ('Western')
on conflict (name) do nothing;

insert into public.billboard_types (name)
values
  ('backlit'),
  ('bridge-panel')
on conflict (name) do nothing;

insert into public.billboards (
  name,
  code,
  type,
  status,
  width_ft,
  height_ft,
  latitude,
  longitude,
  address,
  region,
  facing_direction,
  traffic_count,
  illuminated,
  notes,
  cover_image_url
)
values
  (
    'Accra Mall Facing East',
    'ACC-001',
    'traditional',
    'occupied',
    48,
    14,
    5.6356,
    -0.1547,
    'Spintex Road, Accra',
    'Greater Accra',
    'East',
    '~15,000 vehicles/day',
    true,
    '[sample] High-visibility mall approach board',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'Kumasi City Centre Digital',
    'KUM-014',
    'digital',
    'occupied',
    32,
    12,
    6.6885,
    -1.6244,
    'Adum, Kumasi',
    'Ashanti',
    'North',
    '~22,000 vehicles/day',
    true,
    '[sample] Downtown digital screen',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'Tema Harbour Approach',
    'TEM-009',
    'traditional',
    'available',
    40,
    14,
    5.6698,
    0.0166,
    'Harbour Road, Tema',
    'Greater Accra',
    'South',
    '~12,500 vehicles/day',
    false,
    '[sample] Port corridor board',
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'Takoradi Market Circle',
    'TAK-006',
    'traditional',
    'maintenance',
    36,
    12,
    4.8977,
    -1.7591,
    'Market Circle, Takoradi',
    'Western',
    'West',
    '~9,800 vehicles/day',
    true,
    '[sample] Maintenance watchlist board',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'Ho Central Roundabout',
    'HO-003',
    'digital',
    'occupied',
    28,
    10,
    6.6008,
    0.4713,
    'Central Roundabout, Ho',
    'Volta',
    'East',
    '~7,000 vehicles/day',
    true,
    '[sample] Regional capital digital panel',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80'
  );

insert into public.clients (
  company_name,
  contact_name,
  contact_email,
  contact_phone,
  industry,
  address,
  notes
)
values
  (
    'BlueWave Telecom',
    'Ama Mensah',
    'ama.mensah@bluewave.example',
    '+233 20 555 0101',
    'Telecommunications',
    'Airport City, Accra',
    '[sample] National telecom campaign client'
  ),
  (
    'Sunrise Bank',
    'Kwesi Boateng',
    'kwesi.boateng@sunrisebank.example',
    '+233 24 555 0102',
    'Financial Services',
    'Ridge, Accra',
    '[sample] Retail banking awareness campaign'
  ),
  (
    'Fresh Basket Foods',
    'Efua Ansah',
    'efua.ansah@freshbasket.example',
    '+233 27 555 0103',
    'Consumer Goods',
    'Dzorwulu, Accra',
    '[sample] FMCG seasonal promotion client'
  );

insert into public.contracts (
  contract_number,
  client_id,
  billboard_id,
  start_date,
  end_date,
  monthly_rate,
  currency,
  payment_status,
  amount_paid,
  status,
  notes
)
select
  seed.contract_number,
  clients.id,
  billboards.id,
  seed.start_date,
  seed.end_date,
  seed.monthly_rate,
  'GHS',
  seed.payment_status,
  seed.amount_paid,
  seed.status,
  seed.notes
from (
  values
    ('TKA-2026-1001', 'BlueWave Telecom', 'ACC-001', date '2026-01-01', date '2026-06-30', 18000, 'partial', 54000, 'active', '[sample] H1 city visibility burst'),
    ('TKA-2026-1002', 'Sunrise Bank', 'KUM-014', date '2026-03-01', date '2026-12-31', 25000, 'partial', 100000, 'active', '[sample] Full-year regional digital campaign'),
    ('TKA-2026-1003', 'Fresh Basket Foods', 'HO-003', date '2026-05-01', date '2026-08-31', 12000, 'unpaid', 0, 'active', '[sample] Mid-year regional promotion'),
    ('TKA-2025-1099', 'BlueWave Telecom', 'TEM-009', date '2025-09-01', date '2025-12-31', 9000, 'paid', 36000, 'expired', '[sample] Previous seasonal placement')
) as seed(contract_number, company_name, board_code, start_date, end_date, monthly_rate, payment_status, amount_paid, status, notes)
join public.clients clients on clients.company_name = seed.company_name and clients.notes like '[sample]%'
join public.billboards billboards on billboards.code = seed.board_code and billboards.notes like '[sample]%';

insert into public.payments (
  contract_id,
  amount,
  payment_date,
  payment_method,
  reference,
  notes
)
select
  contracts.id,
  seed.amount,
  seed.payment_date,
  seed.payment_method,
  seed.reference,
  seed.notes
from (
  values
    ('TKA-2026-1001', 18000, date '2026-01-05', 'bank_transfer', 'BW-001', '[sample] January payment'),
    ('TKA-2026-1001', 18000, date '2026-02-05', 'bank_transfer', 'BW-002', '[sample] February payment'),
    ('TKA-2026-1001', 18000, date '2026-03-05', 'mobile_money', 'BW-003', '[sample] March payment'),
    ('TKA-2026-1002', 25000, date '2026-03-03', 'bank_transfer', 'SB-001', '[sample] March payment'),
    ('TKA-2026-1002', 25000, date '2026-04-03', 'bank_transfer', 'SB-002', '[sample] April payment'),
    ('TKA-2026-1002', 25000, date '2026-05-03', 'cheque', 'SB-003', '[sample] May payment'),
    ('TKA-2026-1002', 25000, date '2026-06-03', 'bank_transfer', 'SB-004', '[sample] June payment')
) as seed(contract_number, amount, payment_date, payment_method, reference, notes)
join public.contracts contracts on contracts.contract_number = seed.contract_number and contracts.notes like '[sample]%';

insert into public.inspection_logs (
  billboard_id,
  inspector_id,
  inspected_at,
  overall_condition,
  structure_ok,
  lighting_ok,
  artwork_ok,
  visibility_ok,
  notes,
  action_required,
  action_description,
  action_resolved
)
select
  billboards.id,
  profiles.id,
  seed.inspected_at,
  seed.overall_condition,
  seed.structure_ok,
  seed.lighting_ok,
  seed.artwork_ok,
  seed.visibility_ok,
  seed.notes,
  seed.action_required,
  seed.action_description,
  seed.action_resolved
from (
  values
    ('ACC-001', now() - interval '18 days', 'good', true, true, true, true, '[sample] Clean install and strong sightline', false, null, false),
    ('KUM-014', now() - interval '9 days', 'excellent', true, true, true, true, '[sample] Digital panel performing within expected range', false, null, false),
    ('TAK-006', now() - interval '4 days', 'poor', true, false, true, false, '[sample] Lighting issue on west-facing side', true, 'Repair lighting and trim vegetation near sightline', false),
    ('HO-003', now() - interval '12 days', 'fair', true, true, true, true, '[sample] Minor casing wear but campaign remains visible', false, null, false)
) as seed(board_code, inspected_at, overall_condition, structure_ok, lighting_ok, artwork_ok, visibility_ok, notes, action_required, action_description, action_resolved)
join public.billboards billboards on billboards.code = seed.board_code and billboards.notes like '[sample]%'
join lateral (
  select id
  from public.profiles
  where role in ('admin', 'sales', 'inspector')
    and is_active = true
  order by created_at
  limit 1
) profiles on true;

insert into public.inspection_photos (
  inspection_id,
  photo_url,
  caption
)
select
  inspection_logs.id,
  seed.photo_url,
  seed.caption
from (
  values
    ('ACC-001', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80', 'Morning visibility check'),
    ('KUM-014', 'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1200&q=80', 'Digital display during afternoon traffic'),
    ('TAK-006', 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', 'Maintenance issue reference photo')
) as seed(board_code, photo_url, caption)
join public.inspection_logs inspection_logs on inspection_logs.notes like '[sample]%' and inspection_logs.billboard_id = (
  select id
  from public.billboards
  where code = seed.board_code
    and notes like '[sample]%'
  limit 1
);

commit;
