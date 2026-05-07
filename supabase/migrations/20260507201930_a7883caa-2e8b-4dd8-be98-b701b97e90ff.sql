DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'joseadalbertoferrari@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET plan = 'premium', status = 'active' WHERE user_id = uid;
  END IF;
END $$;