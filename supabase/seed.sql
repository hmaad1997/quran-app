-- Dev seed data (run manually against a dev project only)
insert into public.organizations (id, name, subscription_plan) values
  ('00000000-0000-0000-0000-000000000001', 'Basma Demo Co.', 'pro')
  on conflict (id) do nothing;

insert into public.workplaces (id, org_id, name, latitude, longitude, radius) values
  ('00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000001',
   'HQ — Amman',
   31.9539, 35.9106, 50)
  on conflict (id) do nothing;
