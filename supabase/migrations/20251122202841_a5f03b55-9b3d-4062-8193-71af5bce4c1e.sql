-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON group_members;
DROP POLICY IF EXISTS "Users can view read receipts for messages in their groups" ON message_reads;
DROP POLICY IF EXISTS "Users can view messages in their groups" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their groups" ON messages;

-- Create simpler public policies for custom auth
-- Groups table
CREATE POLICY "Anyone can view groups" 
ON groups FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create groups" 
ON groups FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update groups" 
ON groups FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete groups" 
ON groups FOR DELETE 
USING (true);

-- Group members table
CREATE POLICY "Anyone can view group members" 
ON group_members FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join groups" 
ON group_members FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can leave groups" 
ON group_members FOR DELETE 
USING (true);

-- Messages table
CREATE POLICY "Anyone can view messages" 
ON messages FOR SELECT 
USING (true);

CREATE POLICY "Anyone can send messages" 
ON messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update messages" 
ON messages FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete messages" 
ON messages FOR DELETE 
USING (true);

-- Message reads table
CREATE POLICY "Anyone can view message reads" 
ON message_reads FOR SELECT 
USING (true);

CREATE POLICY "Anyone can mark messages as read" 
ON message_reads FOR INSERT 
WITH CHECK (true);