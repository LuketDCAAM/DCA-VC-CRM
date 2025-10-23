-- Update deals to parse location into city, state_province, and country
-- This handles various location formats

UPDATE deals
SET 
  city = CASE
    -- Format: "City, State, Country" - extract first part
    WHEN location ~ '^[^,]+,\s*[^,]+,\s*[^,]+$' THEN 
      TRIM(SPLIT_PART(location, ',', 1))
    -- Format: "City, State" - extract first part
    WHEN location ~ '^[^,]+,\s*[^,]+$' THEN 
      TRIM(SPLIT_PART(location, ',', 1))
    -- Single value - leave city empty
    ELSE NULL
  END,
  state_province = CASE
    -- Format: "City, State, Country" - extract middle part
    WHEN location ~ '^[^,]+,\s*[^,]+,\s*[^,]+$' THEN 
      TRIM(SPLIT_PART(location, ',', 2))
    -- Format: "City, State" - extract second part
    WHEN location ~ '^[^,]+,\s*[^,]+$' THEN 
      TRIM(SPLIT_PART(location, ',', 2))
    -- Format: "State, Country" or single value - leave state empty
    ELSE NULL
  END,
  country = CASE
    -- Format: "City, State, Country" - extract last part
    WHEN location ~ '^[^,]+,\s*[^,]+,\s*[^,]+$' THEN 
      TRIM(SPLIT_PART(location, ',', 3))
    -- Format: "State, Country" - extract second part if not already handled
    WHEN location ~ '^[^,]+,\s*[^,]+$' AND 
         TRIM(SPLIT_PART(location, ',', 1)) IN ('California', 'Texas', 'New York', 'Florida', 'Illinois', 'Massachusetts', 'Washington', 'Colorado', 'Georgia', 'North Carolina', 'Virginia', 'Arizona', 'Oregon', 'Pennsylvania', 'Michigan', 'Ohio', 'Indiana', 'Tennessee', 'Maryland', 'Wisconsin', 'Minnesota', 'Utah', 'Nevada', 'Connecticut', 'Kansas', 'Alabama', 'Kentucky', 'Louisiana', 'South Carolina', 'Oklahoma', 'Arkansas', 'Iowa', 'Mississippi', 'New Jersey', 'New Mexico', 'Nebraska', 'West Virginia', 'Idaho', 'Hawaii', 'New Hampshire', 'Maine', 'Montana', 'Rhode Island', 'Delaware', 'South Dakota', 'North Dakota', 'Alaska', 'Vermont', 'Wyoming', 'CA', 'TX', 'NY', 'FL', 'IL', 'MA', 'WA', 'CO', 'GA', 'NC', 'VA', 'AZ', 'OR', 'PA', 'MI', 'OH', 'IN', 'TN', 'MD', 'WI', 'MN', 'UT', 'NV', 'CT', 'KS', 'AL', 'KY', 'LA', 'SC', 'OK', 'AR', 'IA', 'MS', 'NJ', 'NM', 'NE', 'WV', 'ID', 'HI', 'NH', 'ME', 'MT', 'RI', 'DE', 'SD', 'ND', 'AK', 'VT', 'WY') THEN 
      TRIM(SPLIT_PART(location, ',', 2))
    -- Single country value
    WHEN location !~ ',' THEN 
      location
    ELSE NULL
  END
WHERE 
  location IS NOT NULL 
  AND location != ''
  AND (city IS NULL OR state_province IS NULL OR country IS NULL);