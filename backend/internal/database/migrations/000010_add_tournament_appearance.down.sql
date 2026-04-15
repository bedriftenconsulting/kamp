-- Migration: 000010_add_tournament_appearance.down.sql
-- Reverses the appearance columns added in the up migration.

ALTER TABLE tournaments
    DROP COLUMN IF EXISTS banner_image,
    DROP COLUMN IF EXISTS accent_color;
