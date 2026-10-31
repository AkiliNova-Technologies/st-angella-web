-- St. Angella Supabase security boundary. Contains no credentials.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
revoke create on schema public from public;
grant usage on schema public to anon, authenticated;

-- Prisma receives this NOLOGIN capability role. A separate LOGIN role is
-- provisioned out-of-band and granted membership after deployment approval.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'st_angella_runtime') then
    create role st_angella_runtime nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls;
  end if;
end $$;
grant usage on schema public to st_angella_runtime;

alter table public.staff_profiles add constraint staff_profiles_auth_user_id_fkey foreign key (auth_user_id) references auth.users(id) on delete cascade;
alter table public.staff_memberships add constraint staff_memberships_granted_by_fkey foreign key (granted_by) references public.staff_profiles(id) on delete restrict;
alter table public.school_settings add constraint school_settings_updated_by_fkey foreign key (updated_by) references public.staff_profiles(id) on delete restrict;

alter table public.staff_profiles add constraint staff_profiles_display_name_not_blank check (btrim(display_name) <> '');
alter table public.page_contents add constraint page_contents_slug_not_blank check (btrim(slug) <> '');
alter table public.page_contents add constraint page_contents_title_not_blank check (btrim(title) <> '');
alter table public.news_articles add constraint news_articles_slug_not_blank check (btrim(slug) <> '');
alter table public.news_articles add constraint news_articles_title_not_blank check (btrim(title) <> '');
alter table public.school_events add constraint school_events_slug_not_blank check (btrim(slug) <> '');
alter table public.school_events add constraint school_events_title_not_blank check (btrim(title) <> '');
alter table public.school_events add constraint school_events_date_range check (ends_at is null or ends_at >= starts_at);
alter table public.content_revisions add constraint content_revisions_number_positive check (revision_number > 0);
alter table public.media_categories add constraint media_categories_name_not_blank check (btrim(name) <> '');
alter table public.media_categories add constraint media_categories_slug_not_blank check (btrim(slug) <> '');
alter table public.media_assets add constraint media_assets_bucket_not_blank check (btrim(bucket) <> '');
alter table public.media_assets add constraint media_assets_object_path_not_blank check (btrim(object_path) <> '');
alter table public.media_assets add constraint media_assets_mime_type_not_blank check (btrim(mime_type) <> '');
alter table public.media_assets add constraint media_assets_byte_size_positive check (byte_size > 0);
alter table public.media_assets add constraint media_assets_known_bucket check (bucket in ('school-photography','news-images','gallery-images','brand-assets'));
alter table public.media_consent_records add constraint media_consent_valid_range check (valid_until is null or valid_from is null or valid_until >= valid_from);
alter table public.admission_enquiries add constraint admission_enquiries_class_check check (intended_class in ('Nursery','P1','P2','P3','P4','P5','P6','P7'));
alter table public.school_settings add constraint school_settings_key_not_blank check (btrim(key) <> '');

insert into public.staff_roles (code, description) values
  ('SUPER_ADMIN', 'Full administration, staff, configuration, content, media, and enquiry access.'),
  ('EDITOR', 'Create and edit content, submit content for review, and manage authorized media.'),
  ('REVIEWER', 'Review independent submissions and publish approved content and media.')
on conflict (code) do update set description = excluded.description;

create or replace function private.current_staff_profile_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select p.id from public.staff_profiles p
  where p.auth_user_id = (select auth.uid()) and p.is_active = true limit 1
$$;
create or replace function private.staff_has_exact_role(required_role public."StaffRoleCode")
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_profiles p
    join public.staff_memberships m on m.profile_id = p.id
    join public.staff_roles r on r.id = m.role_id
    where p.auth_user_id = (select auth.uid()) and p.is_active and r.code = required_role
  )
$$;
create or replace function private.staff_can(required_role public."StaffRoleCode")
returns boolean language sql stable security definer set search_path = '' as $$
  select private.staff_has_exact_role('SUPER_ADMIN') or private.staff_has_exact_role(required_role)
$$;
revoke all on function private.current_staff_profile_id() from public, anon, authenticated;
revoke all on function private.staff_has_exact_role(public."StaffRoleCode") from public, anon, authenticated;
revoke all on function private.staff_can(public."StaffRoleCode") from public, anon, authenticated;
grant usage on schema private to anon, authenticated, st_angella_runtime;
grant execute on function private.current_staff_profile_id() to authenticated;
grant execute on function private.staff_has_exact_role(public."StaffRoleCode") to authenticated;
grant execute on function private.staff_can(public."StaffRoleCode") to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
revoke all on function private.set_updated_at() from public, anon, authenticated;
create trigger staff_profiles_set_updated_at before update on public.staff_profiles for each row execute function private.set_updated_at();
create trigger page_contents_set_updated_at before update on public.page_contents for each row execute function private.set_updated_at();
create trigger news_articles_set_updated_at before update on public.news_articles for each row execute function private.set_updated_at();
create trigger school_events_set_updated_at before update on public.school_events for each row execute function private.set_updated_at();
create trigger media_assets_set_updated_at before update on public.media_assets for each row execute function private.set_updated_at();
create trigger admission_enquiries_set_updated_at before update on public.admission_enquiries for each row execute function private.set_updated_at();
create trigger contact_enquiries_set_updated_at before update on public.contact_enquiries for each row execute function private.set_updated_at();
create trigger school_settings_set_updated_at before update on public.school_settings for each row execute function private.set_updated_at();

create or replace function private.protect_immutable_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Immutable record identity cannot be changed' using errcode = '23514';
  end if;
  if tg_table_name in ('page_contents','news_articles','school_events') and new.created_by_id is distinct from old.created_by_id then
    raise exception 'Content ownership cannot be reassigned' using errcode = '23514';
  elsif tg_table_name = 'media_assets' and (new.uploaded_by_id is distinct from old.uploaded_by_id or new.bucket is distinct from old.bucket or new.object_path is distinct from old.object_path) then
    raise exception 'Media ownership and object identity cannot be reassigned' using errcode = '23514';
  elsif tg_table_name = 'media_consent_records' and (new.media_asset_id is distinct from old.media_asset_id or new.recorded_by_id is distinct from old.recorded_by_id) then
    raise exception 'Consent attribution cannot be reassigned' using errcode = '23514';
  elsif tg_table_name = 'content_revisions' and (new.entity_type is distinct from old.entity_type or new.entity_id is distinct from old.entity_id or new.revision_number is distinct from old.revision_number or new.author_id is distinct from old.author_id) then
    raise exception 'Revision attribution cannot be changed' using errcode = '23514';
  elsif tg_table_name = 'staff_profiles' and new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'Staff Auth identity cannot be reassigned' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function private.protect_immutable_fields() from public, anon, authenticated;
create trigger page_contents_immutable before update on public.page_contents for each row execute function private.protect_immutable_fields();
create trigger news_articles_immutable before update on public.news_articles for each row execute function private.protect_immutable_fields();
create trigger school_events_immutable before update on public.school_events for each row execute function private.protect_immutable_fields();
create trigger media_assets_immutable before update on public.media_assets for each row execute function private.protect_immutable_fields();
create trigger media_consents_immutable before update on public.media_consent_records for each row execute function private.protect_immutable_fields();
create trigger content_revisions_immutable before update on public.content_revisions for each row execute function private.protect_immutable_fields();
create trigger staff_profiles_immutable before update on public.staff_profiles for each row execute function private.protect_immutable_fields();

create or replace function private.validate_revision_target()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_exists boolean;
begin
  target_exists := case new.entity_type
    when 'PAGE' then exists(select 1 from public.page_contents where id = new.entity_id)
    when 'NEWS_ARTICLE' then exists(select 1 from public.news_articles where id = new.entity_id)
    when 'SCHOOL_EVENT' then exists(select 1 from public.school_events where id = new.entity_id)
  end;
  if not coalesce(target_exists, false) then raise exception 'Revision target does not exist' using errcode = '23503'; end if;
  return new;
end $$;
revoke all on function private.validate_revision_target() from public, anon, authenticated;
create trigger content_revision_target before insert on public.content_revisions for each row execute function private.validate_revision_target();

create or replace function private.validate_review_decision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare revision_author uuid; content_creator uuid; revision_type public."ContentEntityType"; target_id uuid;
begin
  select author_id, entity_type, entity_id into revision_author, revision_type, target_id
  from public.content_revisions where id = new.revision_id;
  if revision_author is null then raise exception 'Revision does not exist' using errcode = '23503'; end if;
  content_creator := case revision_type
    when 'PAGE' then (select created_by_id from public.page_contents where id = target_id)
    when 'NEWS_ARTICLE' then (select created_by_id from public.news_articles where id = target_id)
    when 'SCHOOL_EVENT' then (select created_by_id from public.school_events where id = target_id)
  end;
  if new.reviewer_id = revision_author or new.reviewer_id = content_creator then
    raise exception 'Staff cannot review their own submission' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function private.validate_review_decision() from public, anon, authenticated;
create trigger content_review_independence before insert on public.content_reviews for each row execute function private.validate_review_decision();

create or replace function private.validate_content_transition()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare latest_revision uuid; independent_approval boolean; expected_type public."ContentEntityType";
begin
  if old.status = new.status then return new; end if;
  if not (
    (old.status = 'DRAFT' and new.status = 'IN_REVIEW') or
    (old.status = 'IN_REVIEW' and new.status in ('DRAFT','APPROVED')) or
    (old.status = 'APPROVED' and new.status in ('DRAFT','PUBLISHED')) or
    (old.status = 'PUBLISHED' and new.status = 'ARCHIVED') or
    (old.status = 'ARCHIVED' and new.status = 'DRAFT')
  ) then raise exception 'Invalid content transition from % to %', old.status, new.status using errcode = '23514'; end if;
  if new.status in ('APPROVED','PUBLISHED') then
    expected_type := case tg_table_name
      when 'page_contents' then 'PAGE'::public."ContentEntityType"
      when 'news_articles' then 'NEWS_ARTICLE'::public."ContentEntityType"
      when 'school_events' then 'SCHOOL_EVENT'::public."ContentEntityType" end;
    select cr.id into latest_revision from public.content_revisions cr
      where cr.entity_id = new.id and cr.entity_type = expected_type order by cr.revision_number desc limit 1;
    select exists (
      select 1 from public.content_reviews rv
      join public.content_revisions cr on cr.id = rv.revision_id
      join public.staff_profiles reviewer on reviewer.id = rv.reviewer_id and reviewer.is_active
      join public.staff_memberships sm on sm.profile_id = reviewer.id
      join public.staff_roles sr on sr.id = sm.role_id and sr.code in ('REVIEWER','SUPER_ADMIN')
      where rv.revision_id = latest_revision and rv.decision = 'APPROVED'
        and rv.reviewer_id <> new.created_by_id and rv.reviewer_id <> cr.author_id
    ) into independent_approval;
    if latest_revision is null or not independent_approval then
      raise exception 'Approval and publishing require an independently approved latest revision' using errcode = '23514';
    end if;
    if new.status = 'PUBLISHED' then new.published_at := coalesce(new.published_at, now()); end if;
  elsif new.status <> 'ARCHIVED' then new.published_at := null;
  end if;
  return new;
end $$;
revoke all on function private.validate_content_transition() from public, anon, authenticated;
create trigger page_content_transition before update of status on public.page_contents for each row execute function private.validate_content_transition();
create trigger news_article_transition before update of status on public.news_articles for each row execute function private.validate_content_transition();
create trigger school_event_transition before update of status on public.school_events for each row execute function private.validate_content_transition();

create or replace function private.transition_content(entity_type public."ContentEntityType", entity_id uuid, target_status public."ContentStatus")
returns void language plpgsql security definer set search_path = '' as $$
declare actor uuid; creator uuid; current_status public."ContentStatus"; allowed boolean := false;
begin
  actor := private.current_staff_profile_id();
  if actor is null then raise exception 'Active staff session required' using errcode = '42501'; end if;
  case entity_type
    when 'PAGE' then select created_by_id, status into creator, current_status from public.page_contents where id = entity_id for update;
    when 'NEWS_ARTICLE' then select created_by_id, status into creator, current_status from public.news_articles where id = entity_id for update;
    when 'SCHOOL_EVENT' then select created_by_id, status into creator, current_status from public.school_events where id = entity_id for update;
  end case;
  if creator is null then raise exception 'Content does not exist' using errcode = 'P0002'; end if;
  if current_status = 'DRAFT' and target_status = 'IN_REVIEW' then
    allowed := creator = actor and private.staff_can('EDITOR');
  elsif current_status = 'IN_REVIEW' and target_status = 'DRAFT' then
    allowed := (creator = actor and private.staff_can('EDITOR')) or private.staff_has_exact_role('SUPER_ADMIN');
  elsif current_status = 'IN_REVIEW' and target_status = 'APPROVED' then
    allowed := creator <> actor and private.staff_can('REVIEWER');
  elsif current_status = 'APPROVED' and target_status = 'PUBLISHED' then
    allowed := creator <> actor and private.staff_can('REVIEWER');
  elsif current_status = 'PUBLISHED' and target_status = 'ARCHIVED' then
    allowed := private.staff_can('REVIEWER');
  elsif current_status = 'ARCHIVED' and target_status = 'DRAFT' then
    allowed := private.staff_has_exact_role('SUPER_ADMIN');
  end if;
  if not allowed then raise exception 'Content transition is not authorized' using errcode = '42501'; end if;
  case entity_type
    when 'PAGE' then update public.page_contents set status = target_status where id = entity_id;
    when 'NEWS_ARTICLE' then update public.news_articles set status = target_status where id = entity_id;
    when 'SCHOOL_EVENT' then update public.school_events set status = target_status where id = entity_id;
  end case;
end $$;
revoke all on function private.transition_content(public."ContentEntityType", uuid, public."ContentStatus") from public, anon, authenticated;
grant execute on function private.transition_content(public."ContentEntityType", uuid, public."ContentStatus") to authenticated;
create or replace function public.transition_content(entity_type public."ContentEntityType", entity_id uuid, target_status public."ContentStatus")
returns void language sql security invoker set search_path = '' as $$
  select private.transition_content(entity_type, entity_id, target_status)
$$;
revoke all on function public.transition_content(public."ContentEntityType", uuid, public."ContentStatus") from public, anon;
grant execute on function public.transition_content(public."ContentEntityType", uuid, public."ContentStatus") to authenticated;

create or replace function private.media_is_publicly_eligible(asset_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.media_assets m where m.id = asset_id and m.is_public and m.is_approved
      and nullif(btrim(m.alt_text), '') is not null
      and (not m.contains_pupils or exists (
        select 1 from public.media_consent_records c where c.media_asset_id = m.id and c.status = 'GRANTED'
          and (c.valid_from is null or c.valid_from <= current_date)
          and (c.valid_until is null or c.valid_until >= current_date)
      ))
  )
$$;
create or replace function private.media_object_is_publicly_eligible(object_bucket text, object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.media_assets m where m.bucket = object_bucket and m.object_path = object_name
      and private.media_is_publicly_eligible(m.id)
  )
$$;
revoke all on function private.media_is_publicly_eligible(uuid) from public, anon, authenticated;
revoke all on function private.media_object_is_publicly_eligible(text, text) from public, anon, authenticated;
grant execute on function private.media_is_publicly_eligible(uuid) to anon, authenticated, st_angella_runtime;
grant execute on function private.media_object_is_publicly_eligible(text, text) to anon, authenticated;

create or replace function private.validate_media_publication()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.is_public and not private.media_is_publicly_eligible(new.id) then
    raise exception 'Public media requires approval, alt text, and valid pupil consent' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function private.validate_media_publication() from public, anon, authenticated;
create constraint trigger media_publication_eligibility
after insert or update of is_public, is_approved, contains_pupils, alt_text on public.media_assets
deferrable initially immediate for each row execute function private.validate_media_publication();

create or replace function private.set_media_publication(asset_id uuid, approve boolean, publish boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare actor uuid; uploader uuid;
begin
  actor := private.current_staff_profile_id();
  if actor is null or not private.staff_can('REVIEWER') then raise exception 'Reviewer authorization required' using errcode = '42501'; end if;
  select uploaded_by_id into uploader from public.media_assets where id = asset_id for update;
  if uploader is null then raise exception 'Media asset does not exist' using errcode = 'P0002'; end if;
  if uploader = actor then raise exception 'Staff cannot approve their own media submission' using errcode = '42501'; end if;
  if publish and not approve then raise exception 'Published media must be approved' using errcode = '23514'; end if;
  update public.media_assets set is_approved = approve, is_public = publish where id = asset_id;
end $$;
revoke all on function private.set_media_publication(uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function private.set_media_publication(uuid, boolean, boolean) to authenticated;
create or replace function public.set_media_publication(asset_id uuid, approve boolean, publish boolean)
returns void language sql security invoker set search_path = '' as $$
  select private.set_media_publication(asset_id, approve, publish)
$$;
revoke all on function public.set_media_publication(uuid, boolean, boolean) from public, anon;
grant execute on function public.set_media_publication(uuid, boolean, boolean) to authenticated;

create or replace function private.audit_safe_row(table_name text, row_data jsonb)
returns jsonb language sql immutable security invoker set search_path = '' as $$
  select case table_name
    when 'page_contents' then row_data - array['body']
    when 'news_articles' then row_data - array['body','summary']
    when 'school_events' then row_data - array['body','summary','location']
    when 'media_consent_records' then row_data - array['reference_code','notes']
    when 'content_reviews' then row_data - array['notes']
    else row_data
  end
$$;
revoke all on function private.audit_safe_row(text, jsonb) from public, anon, authenticated;
create or replace function private.write_audit_log()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid; record_id uuid; old_data jsonb; new_data jsonb;
begin
  actor := private.current_staff_profile_id();
  if tg_op = 'DELETE' then
    record_id := old.id; old_data := private.audit_safe_row(tg_table_name, to_jsonb(old));
  elsif tg_op = 'INSERT' then
    record_id := new.id; new_data := private.audit_safe_row(tg_table_name, to_jsonb(new));
  else
    record_id := new.id;
    old_data := private.audit_safe_row(tg_table_name, to_jsonb(old));
    new_data := private.audit_safe_row(tg_table_name, to_jsonb(new));
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (actor, tg_op, tg_table_name, record_id, jsonb_strip_nulls(jsonb_build_object('old', old_data, 'new', new_data)));
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
revoke all on function private.write_audit_log() from public, anon, authenticated;
create trigger audit_staff_memberships after insert or update or delete on public.staff_memberships for each row execute function private.write_audit_log();
create trigger audit_page_contents after insert or update or delete on public.page_contents for each row execute function private.write_audit_log();
create trigger audit_news_articles after insert or update or delete on public.news_articles for each row execute function private.write_audit_log();
create trigger audit_school_events after insert or update or delete on public.school_events for each row execute function private.write_audit_log();
create trigger audit_content_reviews after insert or update or delete on public.content_reviews for each row execute function private.write_audit_log();
create trigger audit_media_assets after insert or update or delete on public.media_assets for each row execute function private.write_audit_log();
create trigger audit_media_consents after insert or update or delete on public.media_consent_records for each row execute function private.write_audit_log();
create trigger audit_school_settings after insert or update or delete on public.school_settings for each row execute function private.write_audit_log();

-- Prepared but not scheduled or granted. It can only purge records already
-- soft-deleted after a separately approved retention activation.
create or replace function private.purge_expired_enquiries(retention_date date default current_date)
returns table(admission_deleted bigint, contact_deleted bigint)
language plpgsql security definer set search_path = '' as $$
declare admission_count bigint; contact_count bigint;
begin
  delete from public.admission_enquiries where retention_until < retention_date and deleted_at is not null;
  get diagnostics admission_count = row_count;
  delete from public.contact_enquiries where retention_until < retention_date and deleted_at is not null;
  get diagnostics contact_count = row_count;
  return query select admission_count, contact_count;
end $$;
revoke all on function private.purge_expired_enquiries(date) from public, anon, authenticated, st_angella_runtime;

-- Remove broad Data API access, then grant only intentional operations.
revoke all on all tables in schema public from public, anon, authenticated, st_angella_runtime;
grant select on public.page_contents, public.news_articles, public.school_events,
  public.media_assets, public.media_categories, public.school_settings to anon, authenticated, st_angella_runtime;
grant select on public.staff_profiles, public.staff_roles, public.staff_memberships,
  public.content_revisions, public.content_reviews, public.media_consent_records,
  public.admission_enquiries, public.contact_enquiries, public.audit_logs to authenticated;
grant insert on public.page_contents, public.news_articles, public.school_events,
  public.content_revisions, public.content_reviews, public.media_assets,
  public.media_consent_records, public.media_categories, public.staff_profiles,
  public.staff_memberships, public.school_settings to authenticated;
grant update (slug, title, body, updated_at) on public.page_contents to authenticated;
grant update (slug, title, summary, body, featured_media_id, updated_at) on public.news_articles to authenticated;
grant update (slug, title, summary, body, starts_at, ends_at, location, featured_media_id, updated_at) on public.school_events to authenticated;
grant update (display_name, is_active, updated_at) on public.staff_profiles to authenticated;
grant update (name, slug) on public.media_categories to authenticated;
grant update (mime_type, byte_size, alt_text, category_id, contains_pupils, updated_at) on public.media_assets to authenticated;
grant update (key, value, is_public, updated_by, updated_at) on public.school_settings to authenticated;
grant update (status, deleted_at, updated_at) on public.admission_enquiries, public.contact_enquiries to authenticated;
grant delete on public.staff_memberships, public.media_categories to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['staff_profiles','staff_roles','staff_memberships','page_contents','news_articles','school_events','content_revisions','content_reviews','media_categories','media_assets','media_consent_records','admission_enquiries','contact_enquiries','school_settings','audit_logs']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

create policy staff_read_own_or_super on public.staff_profiles for select to authenticated using (auth_user_id = (select auth.uid()) or (select private.staff_has_exact_role('SUPER_ADMIN')));
create policy staff_super_insert on public.staff_profiles for insert to authenticated with check ((select private.staff_has_exact_role('SUPER_ADMIN')) and auth_user_id <> (select auth.uid()));
create policy staff_super_update on public.staff_profiles for update to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN'))) with check ((select private.staff_has_exact_role('SUPER_ADMIN')));
create policy roles_staff_read on public.staff_roles for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy memberships_read_own_or_super on public.staff_memberships for select to authenticated using (profile_id = (select private.current_staff_profile_id()) or (select private.staff_has_exact_role('SUPER_ADMIN')));
create policy memberships_super_insert on public.staff_memberships for insert to authenticated with check ((select private.staff_has_exact_role('SUPER_ADMIN')) and profile_id <> (select private.current_staff_profile_id()) and granted_by = (select private.current_staff_profile_id()));
create policy memberships_super_delete on public.staff_memberships for delete to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN')) and profile_id <> (select private.current_staff_profile_id()));

create policy pages_public_read on public.page_contents for select to anon, authenticated, st_angella_runtime using (status = 'PUBLISHED' and published_at <= now());
create policy pages_staff_read on public.page_contents for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy pages_editor_insert on public.page_contents for insert to authenticated with check ((select private.staff_can('EDITOR')) and created_by_id = (select private.current_staff_profile_id()) and status = 'DRAFT');
create policy pages_editor_update on public.page_contents for update to authenticated using ((select private.staff_can('EDITOR')) and (created_by_id = (select private.current_staff_profile_id()) or (select private.staff_has_exact_role('SUPER_ADMIN'))) and status in ('DRAFT','IN_REVIEW')) with check (status in ('DRAFT','IN_REVIEW'));
create policy articles_public_read on public.news_articles for select to anon, authenticated, st_angella_runtime using (status = 'PUBLISHED' and published_at <= now());
create policy articles_staff_read on public.news_articles for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy articles_editor_insert on public.news_articles for insert to authenticated with check ((select private.staff_can('EDITOR')) and created_by_id = (select private.current_staff_profile_id()) and status = 'DRAFT');
create policy articles_editor_update on public.news_articles for update to authenticated using ((select private.staff_can('EDITOR')) and (created_by_id = (select private.current_staff_profile_id()) or (select private.staff_has_exact_role('SUPER_ADMIN'))) and status in ('DRAFT','IN_REVIEW')) with check (status in ('DRAFT','IN_REVIEW'));
create policy events_public_read on public.school_events for select to anon, authenticated, st_angella_runtime using (status = 'PUBLISHED' and published_at <= now());
create policy events_staff_read on public.school_events for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy events_editor_insert on public.school_events for insert to authenticated with check ((select private.staff_can('EDITOR')) and created_by_id = (select private.current_staff_profile_id()) and status = 'DRAFT');
create policy events_editor_update on public.school_events for update to authenticated using ((select private.staff_can('EDITOR')) and (created_by_id = (select private.current_staff_profile_id()) or (select private.staff_has_exact_role('SUPER_ADMIN'))) and status in ('DRAFT','IN_REVIEW')) with check (status in ('DRAFT','IN_REVIEW'));

create policy revisions_staff_read on public.content_revisions for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy revisions_author_insert on public.content_revisions for insert to authenticated with check (author_id = (select private.current_staff_profile_id()) and (select private.staff_can('EDITOR')));
create policy reviews_staff_read on public.content_reviews for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy reviews_reviewer_insert on public.content_reviews for insert to authenticated with check ((select private.staff_can('REVIEWER')) and reviewer_id = (select private.current_staff_profile_id()) and reviewer_id <> (select author_id from public.content_revisions where id = revision_id));

create policy media_public_read on public.media_assets for select to anon, authenticated, st_angella_runtime using ((select private.media_is_publicly_eligible(id)));
create policy media_staff_read on public.media_assets for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy media_editor_insert on public.media_assets for insert to authenticated with check ((select private.staff_can('EDITOR')) and uploaded_by_id = (select private.current_staff_profile_id()) and not is_public and not is_approved);
create policy media_editor_update on public.media_assets for update to authenticated using ((select private.staff_can('EDITOR')) and (uploaded_by_id = (select private.current_staff_profile_id()) or (select private.staff_has_exact_role('SUPER_ADMIN'))) and not is_approved) with check (not is_public and not is_approved);
create policy categories_public_read on public.media_categories for select to anon, authenticated, st_angella_runtime using (true);
create policy categories_super_insert on public.media_categories for insert to authenticated with check ((select private.staff_has_exact_role('SUPER_ADMIN')));
create policy categories_super_update on public.media_categories for update to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN'))) with check ((select private.staff_has_exact_role('SUPER_ADMIN')));
create policy categories_super_delete on public.media_categories for delete to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN')));
create policy consent_staff_read on public.media_consent_records for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy consent_reviewer_insert on public.media_consent_records for insert to authenticated with check ((select private.staff_can('REVIEWER')) and recorded_by_id = (select private.current_staff_profile_id()));

create policy admissions_super_read on public.admission_enquiries for select to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN')) and deleted_at is null);
create policy admissions_super_update on public.admission_enquiries for update to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN'))) with check ((select private.staff_has_exact_role('SUPER_ADMIN')));
create policy contacts_super_read on public.contact_enquiries for select to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN')) and deleted_at is null);
create policy contacts_super_update on public.contact_enquiries for update to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN'))) with check ((select private.staff_has_exact_role('SUPER_ADMIN')));
create policy settings_public_read on public.school_settings for select to anon, authenticated, st_angella_runtime using (is_public);
create policy settings_staff_read on public.school_settings for select to authenticated using ((select private.current_staff_profile_id()) is not null);
create policy settings_super_insert on public.school_settings for insert to authenticated with check ((select private.staff_has_exact_role('SUPER_ADMIN')) and updated_by = (select private.current_staff_profile_id()));
create policy settings_super_update on public.school_settings for update to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN'))) with check ((select private.staff_has_exact_role('SUPER_ADMIN')) and updated_by = (select private.current_staff_profile_id()));
create policy audit_super_read on public.audit_logs for select to authenticated using ((select private.staff_has_exact_role('SUPER_ADMIN')));

-- Private buckets; eligible object downloads are operation-specific so list
-- operations remain denied to anonymous callers.
insert into storage.buckets (id, name, public) values
  ('school-photography','school-photography',false),
  ('news-images','news-images',false),
  ('gallery-images','gallery-images',false),
  ('brand-assets','brand-assets',false)
on conflict (id) do update set public = false;
create policy storage_public_eligible_download on storage.objects for select to anon, authenticated
using (
  bucket_id in ('school-photography','news-images','gallery-images','brand-assets')
  and storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated'])
  and (select private.media_object_is_publicly_eligible(bucket_id, name))
);
create policy storage_staff_read on storage.objects for select to authenticated using (bucket_id in ('school-photography','news-images','gallery-images','brand-assets') and (select private.current_staff_profile_id()) is not null);
create policy storage_editor_insert on storage.objects for insert to authenticated with check (bucket_id in ('school-photography','news-images','gallery-images','brand-assets') and (select private.staff_can('EDITOR')) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_editor_update on storage.objects for update to authenticated using ((select private.staff_can('EDITOR')) and owner_id = (select auth.uid())::text) with check ((select private.staff_can('EDITOR')) and owner_id = (select auth.uid())::text);
create policy storage_editor_delete on storage.objects for delete to authenticated using ((select private.staff_can('EDITOR')) and owner_id = (select auth.uid())::text);

comment on role st_angella_runtime is 'NOLOGIN least-privilege capability role for published public reads. Grant only to a separately provisioned runtime LOGIN role.';
comment on table public.admission_enquiries is 'Public insert intentionally disabled. Retention deletion requires explicit activation approval.';
comment on table public.contact_enquiries is 'Public insert intentionally disabled. Retention deletion requires explicit activation approval.';
alter default privileges revoke execute on functions from public;
alter default privileges revoke all on tables from public, anon, authenticated, st_angella_runtime;
