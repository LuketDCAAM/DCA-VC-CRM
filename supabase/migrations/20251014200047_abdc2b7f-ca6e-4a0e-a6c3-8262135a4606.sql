-- Create a function to parse location strings into components
CREATE OR REPLACE FUNCTION parse_location(location_str text, OUT city text, OUT state_province text, OUT country text)
LANGUAGE plpgsql
AS $$
DECLARE
  parts text[];
  part_count integer;
  state_abbrevs text[] := ARRAY['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
  state_names text[] := ARRAY['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'];
  i integer;
  second_part_upper text;
  is_us_state boolean;
BEGIN
  -- Return nulls if input is null or empty
  IF location_str IS NULL OR TRIM(location_str) = '' THEN
    RETURN;
  END IF;

  -- Split by comma and trim each part
  parts := string_to_array(location_str, ',');
  FOR i IN 1..array_length(parts, 1) LOOP
    parts[i] := TRIM(parts[i]);
  END LOOP;
  
  part_count := array_length(parts, 1);

  -- Parse based on number of parts
  IF part_count >= 3 THEN
    -- Format: City, State, Country
    city := parts[1];
    state_province := parts[2];
    country := parts[3];
    
    -- Normalize US variations
    IF UPPER(country) IN ('USA', 'US', 'U.S.', 'U.S.A.', 'UNITED STATES', 'UNITED STATES OF AMERICA') THEN
      country := 'USA';
    END IF;
    
  ELSIF part_count = 2 THEN
    second_part_upper := UPPER(parts[2]);
    is_us_state := false;
    
    -- Check if second part is a US state abbreviation
    FOR i IN 1..array_length(state_abbrevs, 1) LOOP
      IF second_part_upper = state_abbrevs[i] THEN
        city := parts[1];
        state_province := state_names[i];
        country := 'USA';
        is_us_state := true;
        EXIT;
      END IF;
    END LOOP;
    
    -- Check if second part is a full US state name
    IF NOT is_us_state THEN
      FOR i IN 1..array_length(state_names, 1) LOOP
        IF UPPER(parts[2]) = UPPER(state_names[i]) THEN
          city := parts[1];
          state_province := state_names[i];
          country := 'USA';
          is_us_state := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;
    
    -- If not a US state, treat as City, Country
    IF NOT is_us_state THEN
      city := parts[1];
      country := parts[2];
    END IF;
    
  ELSIF part_count = 1 THEN
    second_part_upper := UPPER(parts[1]);
    is_us_state := false;
    
    -- Check if it's a US state abbreviation
    FOR i IN 1..array_length(state_abbrevs, 1) LOOP
      IF second_part_upper = state_abbrevs[i] THEN
        state_province := state_names[i];
        country := 'USA';
        is_us_state := true;
        EXIT;
      END IF;
    END LOOP;
    
    -- Check if it's a full US state name
    IF NOT is_us_state THEN
      FOR i IN 1..array_length(state_names, 1) LOOP
        IF UPPER(parts[1]) = UPPER(state_names[i]) THEN
          state_province := state_names[i];
          country := 'USA';
          is_us_state := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;
    
    -- If not a US state, treat as country
    IF NOT is_us_state THEN
      country := parts[1];
    END IF;
  END IF;
  
  RETURN;
END;
$$;

-- Migrate existing location data for deals
UPDATE public.deals
SET (city, state_province, country) = (
  SELECT p.city, p.state_province, p.country
  FROM parse_location(location) AS p
)
WHERE location IS NOT NULL AND (city IS NULL OR state_province IS NULL OR country IS NULL);

-- Migrate existing location data for investors
UPDATE public.investors
SET (city, state_province, country) = (
  SELECT p.city, p.state_province, p.country
  FROM parse_location(location) AS p
)
WHERE location IS NOT NULL AND (city IS NULL OR state_province IS NULL OR country IS NULL);

-- Migrate existing location data for lp_engagements
UPDATE public.lp_engagements
SET (city, state_province, country) = (
  SELECT p.city, p.state_province, p.country
  FROM parse_location(location) AS p
)
WHERE location IS NOT NULL AND (city IS NULL OR state_province IS NULL OR country IS NULL);