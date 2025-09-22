-- Clean up orphaned user data for luke@hudstone.vc
-- First remove from user_roles table
DELETE FROM user_roles WHERE user_id = 'dcf0058d-7577-438b-9c3c-33dbdc33d5d0';

-- Then remove from profiles table  
DELETE FROM profiles WHERE id = 'dcf0058d-7577-438b-9c3c-33dbdc33d5d0';

-- Also check and remove any approval records if they exist
DELETE FROM user_approvals WHERE user_id = 'dcf0058d-7577-438b-9c3c-33dbdc33d5d0';