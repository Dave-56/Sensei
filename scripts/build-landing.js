#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const POSTHOG_KEY = process.env.POSTHOG_PROJECT_KEY || 'phc-your-key-here';

// Read the landing page template
const landingPath = path.join(__dirname, '..', 'landing', 'index.html');
let content = fs.readFileSync(landingPath, 'utf8');

// Replace the placeholder with the actual key
content = content.replace('phc-your-key-here', POSTHOG_KEY);

// Write to dist folder
const distPath = path.join(__dirname, '..', 'dist', 'landing', 'index.html');
fs.mkdirSync(path.dirname(distPath), { recursive: true });
fs.writeFileSync(distPath, content);

console.log('✅ Landing page built with PostHog key:', POSTHOG_KEY.substring(0, 10) + '...');
