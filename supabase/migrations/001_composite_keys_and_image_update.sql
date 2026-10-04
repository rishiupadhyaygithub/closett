-- Closett: make ids unique per user, and let owners overwrite their own images.
-- Applied against an existing project whose tables were created with PRIMARY KEY (id).
-- Widening a primary key to (user_id, id) cannot fail on existing rows.

alter table public.categories  drop constraint if exists categories_pkey,  add primary key (user_id, id);
alter table public.items       drop constraint if exists items_pkey,       add primary key (user_id, id);
alter table public.color_rules drop constraint if exists color_rules_pkey, add primary key (user_id, id);

alter table public.categories  alter column user_id set default auth.uid();
alter table public.items       alter column user_id set default auth.uid();
alter table public.color_rules alter column user_id set default auth.uid();

-- Storage had insert/select/delete but no update, so upload(..., { upsert: true }) failed
-- when an existing photo was replaced.
create policy "Users update own images" on storage.objects for update to authenticated
  using      (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid()::text);
