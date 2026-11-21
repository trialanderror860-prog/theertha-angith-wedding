CREATE TABLE public.wedding_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL CHECK (char_length(guest_name) BETWEEN 1 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 32),
  attendance text NOT NULL CHECK (attendance IN ('accepted', 'declined')),
  guest_count integer NOT NULL CHECK (guest_count > 0),
  message text CHECK (message IS NULL OR char_length(message) <= 1000),
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT (guest_name, phone, attendance, guest_count, message) ON TABLE public.wedding_rsvps TO anon;
GRANT ALL ON TABLE public.wedding_rsvps TO service_role;
ALTER TABLE public.wedding_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can submit wedding RSVPs" ON public.wedding_rsvps FOR INSERT TO anon WITH CHECK (true);

CREATE TABLE public.wedding_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL CHECK (char_length(guest_name) BETWEEN 1 AND 120),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  is_approved boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT (guest_name, message) ON TABLE public.wedding_wishes TO anon;
GRANT SELECT (guest_name, message, submitted_at) ON TABLE public.wedding_wishes TO anon;
GRANT ALL ON TABLE public.wedding_wishes TO service_role;
ALTER TABLE public.wedding_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can submit wedding wishes" ON public.wedding_wishes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Visitors can read approved wedding wishes" ON public.wedding_wishes FOR SELECT TO anon USING (is_approved = true);