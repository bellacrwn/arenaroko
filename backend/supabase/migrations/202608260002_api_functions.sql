begin;

create or replace function public.create_pickup(
  p_customer_id uuid,
  p_address jsonb,
  p_pickup_window text,
  p_photo_paths text[],
  p_customer_note text,
  p_items jsonb
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  pickup_record public.pickups;
  item jsonb;
  material_record public.materials;
  line_estimate numeric(14,2);
  total_estimate numeric(14,2) := 0;
  total_weight numeric(12,2) := 0;
  item_count integer := 0;
begin
  if not exists(select 1 from public.profiles where id=p_customer_id and role='distributor' and active=true) then raise exception 'DISTRIBUTOR_REQUIRED'; end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 10 then raise exception 'INVALID_ITEM_COUNT'; end if;
  insert into public.pickups(customer_id,address_label,latitude,longitude,address_notes,pickup_window,photo_paths,customer_note,collector_fee)
    values(p_customer_id,p_address->>'label',(p_address->>'latitude')::double precision,(p_address->>'longitude')::double precision,
      p_address->>'notes',p_pickup_window,coalesce(p_photo_paths,'{}'),p_customer_note,1000 + jsonb_array_length(p_items)*250)
    returning * into pickup_record;
  for item in select * from jsonb_array_elements(p_items)
  loop
    select * into material_record from public.materials where id=item->>'materialId' and active=true;
    if material_record.id is null or (item->>'estimatedWeight')::numeric <= 0 then raise exception 'INVALID_MATERIAL_ITEM'; end if;
    line_estimate := round((item->>'estimatedWeight')::numeric * material_record.rate,2);
    insert into public.pickup_items(pickup_id,material_id,estimated_weight,rate_at_booking,estimated_payout)
      values(pickup_record.id,material_record.id,(item->>'estimatedWeight')::numeric,material_record.rate,line_estimate);
    total_weight := total_weight + (item->>'estimatedWeight')::numeric;
    total_estimate := total_estimate + line_estimate;
    item_count := item_count + 1;
  end loop;
  update public.pickups set estimated_weight=total_weight,estimated_payout=total_estimate where id=pickup_record.id returning * into pickup_record;
  insert into public.notifications(user_id,type,title,message,metadata)
    values(p_customer_id,'pickup_created','Pickup requested',pickup_record.public_id || ' is waiting for a collector.',jsonb_build_object('pickupId',pickup_record.id));
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(p_customer_id,'pickup.created','pickup',pickup_record.id,jsonb_build_object('itemCount',item_count));
  return jsonb_build_object('pickup',to_jsonb(pickup_record),'items',(select jsonb_agg(to_jsonb(pi)) from public.pickup_items pi where pi.pickup_id=pickup_record.id));
end;
$$;

create or replace function public.cancel_pickup(p_pickup_id uuid,p_customer_id uuid)
returns public.pickups language plpgsql security definer set search_path=public as $$
declare result public.pickups;
begin
  select * into result from public.pickups where id=p_pickup_id and customer_id=p_customer_id for update;
  if result.id is null then raise exception 'PICKUP_NOT_FOUND'; end if;
  if result.status not in ('pending','accepted') then raise exception 'CANNOT_CANCEL'; end if;
  update public.pickups set status='cancelled',cancelled_at=now() where id=p_pickup_id returning * into result;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(p_customer_id,'pickup.cancelled','pickup',p_pickup_id);
  return result;
end;
$$;

create or replace function public.create_wallet_withdrawal(p_user_id uuid,p_amount numeric,p_bank_code text,p_account_last4 text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare wallet_record public.wallets; withdrawal_record public.withdrawals; transaction_record public.wallet_transactions;
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  select * into wallet_record from public.wallets where user_id=p_user_id for update;
  if wallet_record.id is null then raise exception 'WALLET_NOT_FOUND'; end if;
  if wallet_record.available_balance < p_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;
  update public.wallets set balance=balance-p_amount,available_balance=available_balance-p_amount where id=wallet_record.id returning * into wallet_record;
  insert into public.withdrawals(wallet_id,user_id,amount,bank_code,account_last4,status,completed_at)
    values(wallet_record.id,p_user_id,p_amount,p_bank_code,p_account_last4,'completed',now()) returning * into withdrawal_record;
  insert into public.wallet_transactions(wallet_id,user_id,type,direction,amount,status,description,metadata)
    values(wallet_record.id,p_user_id,'withdrawal','debit',p_amount,'completed','Withdrawal to ••••' || p_account_last4,jsonb_build_object('withdrawalId',withdrawal_record.id)) returning * into transaction_record;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(p_user_id,'wallet.withdrawal','withdrawal',withdrawal_record.id,jsonb_build_object('amount',p_amount,'accountLast4',p_account_last4));
  return jsonb_build_object('wallet',to_jsonb(wallet_record),'withdrawal',to_jsonb(withdrawal_record),'transaction',to_jsonb(transaction_record));
end;
$$;

revoke all on function public.create_pickup(uuid,jsonb,text,text[],text,jsonb) from public,anon,authenticated;
revoke all on function public.cancel_pickup(uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_wallet_withdrawal(uuid,numeric,text,text) from public,anon,authenticated;
grant execute on function public.create_pickup(uuid,jsonb,text,text[],text,jsonb) to service_role;
grant execute on function public.cancel_pickup(uuid,uuid) to service_role;
grant execute on function public.create_wallet_withdrawal(uuid,numeric,text,text) to service_role;

commit;
