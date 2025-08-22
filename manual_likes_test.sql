-- Check if user_id exists
SELECT * FROM users WHERE id = '08435928-cdd7-4317-8f4b-8ae41b31c3ce';

-- Check if post_id exists
SELECT * FROM posts WHERE id = '93dc337e-2771-48e8-bce1-cd8691455ac5';

-- Try manual insert into likes
INSERT INTO likes (user_id, post_id) VALUES ('08435928-cdd7-4317-8f4b-8ae41b31c3ce', '93dc337e-2771-48e8-bce1-cd8691455ac5');
