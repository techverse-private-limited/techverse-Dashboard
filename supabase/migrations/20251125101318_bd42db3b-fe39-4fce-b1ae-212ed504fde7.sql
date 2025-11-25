-- Add status column to projects table
ALTER TABLE projects ADD COLUMN status text NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'finished'));