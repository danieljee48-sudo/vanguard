-- VanGuard Clean starter checklist reference templates.
-- The app should copy these into a customer's own checklist tables after signup/onboarding.

-- Office Daily Clean
insert into clean_checklists (user_id,name,description,frequency)
select u.id,'Office Daily Clean','Core daily cleaning standard for offices and shared workplaces.','daily'
from auth.users u
where not exists (select 1 from clean_checklists c where c.user_id=u.id);

with office as (
  select id,user_id from clean_checklists where name='Office Daily Clean'
), items(label,sort_order) as (
  values
   ('Empty bins and replace liners',10),
   ('Clean and disinfect high-touch surfaces',20),
   ('Vacuum carpets and mats',30),
   ('Sweep and mop hard floors',40),
   ('Clean toilets, sinks and touchpoints',50),
   ('Restock soap, toilet tissue and paper products',60),
   ('Clean kitchen/break area surfaces',70),
   ('Final visual inspection',80)
)
insert into clean_checklist_items(checklist_id,label,sort_order)
select o.id,i.label,i.sort_order from office o cross join items i
where not exists (select 1 from clean_checklist_items x where x.checklist_id=o.id);

-- Pub / Bar Close Clean
insert into clean_checklists (user_id,name,description,frequency)
select u.id,'Pub & Bar Close Clean','End-of-shift cleaning standard for pubs, bars and hospitality venues.','daily'
from auth.users u
where not exists (select 1 from clean_checklists c where c.user_id=u.id and c.name='Pub & Bar Close Clean');

with bar as (
  select id from clean_checklists where name='Pub & Bar Close Clean'
), items(label,sort_order) as (
  values
   ('Clean and sanitise bar surfaces',10),
   ('Clean taps, handles and high-touch points',20),
   ('Clean glasswashing area',30),
   ('Sweep and mop floors',40),
   ('Clean toilets and replenish consumables',50),
   ('Empty bins and remove waste',60),
   ('Clean tables, chairs and customer areas',70),
   ('Final close-down inspection',80)
)
insert into clean_checklist_items(checklist_id,label,sort_order)
select b.id,i.label,i.sort_order from bar b cross join items i
where not exists (select 1 from clean_checklist_items x where x.checklist_id=b.id);

-- Communal / School Area Clean
insert into clean_checklists (user_id,name,description,frequency)
select u.id,'Communal Area Daily Clean','General standard for schools, community buildings and shared areas.','daily'
from auth.users u
where not exists (select 1 from clean_checklists c where c.user_id=u.id and c.name='Communal Area Daily Clean');

with comm as (
  select id from clean_checklists where name='Communal Area Daily Clean'
), items(label,sort_order) as (
  values
   ('Clean entrance and reception areas',10),
   ('Clean high-touch surfaces and handles',20),
   ('Vacuum/sweep floors',30),
   ('Mop hard floors',40),
   ('Clean toilets and wash areas',50),
   ('Empty bins and remove waste',60),
   ('Restock hygiene consumables',70),
   ('Final safety and cleanliness inspection',80)
)
insert into clean_checklist_items(checklist_id,label,sort_order)
select c.id,i.label,i.sort_order from comm c cross join items i
where not exists (select 1 from clean_checklist_items x where x.checklist_id=c.id);
