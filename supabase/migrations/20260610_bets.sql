-- 下注表 + 原子下注 RPC
-- 积分模型：profiles.balance = 积分余额；sum(active bets.amount) = 调研组合积分；二者之和 = 总积分价值。
-- 下注时把金额从 balance 扣除并写入 bets（amount），即“占时计算在调研组合积分上”。

create table if not exists public.bets (
  id          bigint generated always as identity primary key,
  user_id     uuid    not null references public.profiles(id) on delete cascade,
  survey_id   integer not null references public.surveys(id)  on delete cascade,
  side        text    not null check (side in ('yes', 'no')),
  amount      numeric not null check (amount > 0),  -- 累计下注积分
  odds        numeric not null,                     -- 首次下注时的入场赔率
  status      text    not null default 'active' check (status in ('active', 'settled', 'cancelled')),
  won         boolean,                              -- 结算后是否赢（active 时为 null）
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, survey_id)                       -- 每个用户每个调研一行：再次下注累加同方向
);

create index if not exists bets_user_idx on public.bets (user_id);

alter table public.bets enable row level security;  -- 仅后端 service_role 访问，无 anon 策略

-- 原子下注：校验余额 / 方向，扣余额并累加下注，返回新余额与下注行
create or replace function public.place_bet(
  p_user uuid, p_survey integer, p_side text, p_amount numeric, p_odds numeric
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance  numeric;
  v_existing public.bets%rowtype;
  v_bet      public.bets%rowtype;
begin
  if p_side not in ('yes', 'no') then
    raise exception 'invalid_side';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  -- 锁定用户行，校验余额
  select balance into v_balance from public.profiles where id = p_user for update;
  if not found then
    raise exception 'user_not_found';
  end if;
  if v_balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  -- 已有下注：方向必须一致，累加金额
  select * into v_existing from public.bets
    where user_id = p_user and survey_id = p_survey for update;
  if found then
    if v_existing.side <> p_side then
      raise exception 'side_locked';
    end if;
    update public.bets
      set amount = v_existing.amount + p_amount, updated_at = now()
      where id = v_existing.id
      returning * into v_bet;
  else
    insert into public.bets (user_id, survey_id, side, amount, odds)
      values (p_user, p_survey, p_side, p_amount, p_odds)
      returning * into v_bet;
  end if;

  -- 扣减余额（占时计入调研组合积分）
  update public.profiles set balance = balance - p_amount, updated_at = now()
    where id = p_user
    returning balance into v_balance;

  return json_build_object('balance', v_balance, 'bet', row_to_json(v_bet));
end;
$$;
