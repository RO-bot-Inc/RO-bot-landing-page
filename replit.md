# RO-bot Website

## Overview

RO-bot is a static website for an AI-powered co-pilot platform designed for automotive technicians and service centers. The site showcases voice-driven documentation, AI-assisted diagnostics, and workflow automation tools for the automotive repair industry. Built as a marketing and demonstration website, it includes interactive demos, blog content, and lead generation forms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Static HTML/CSS/JavaScript** foundation using Tailwind CSS for styling
- **Express.js server** for local development and blog post rendering
- **Alpine.js** for interactive navigation components and mobile menus
- **Markdown-it** with front-matter parsing for blog content management
- **Custom CSS animations** for hero section waveform visualizer and interactive demos

### Content Management
- **File-based blog system** using Markdown files with YAML front-matter in `/blog-posts/`
- **Automatic image extraction** from blog post content for card thumbnails
- **Static asset management** through Express.js static file serving
- **Universal navigation component** system for consistent site-wide navigation

### Styling System
- **Tailwind CSS** as the primary CSS framework with custom configuration
- **Custom brand colors** defined in `tailwind.config.js` (brand-dark, brand-green, brand-orange, etc.)
- **Google Fonts integration** using Roboto and Montserrat font families
- **Responsive design** with mobile-first approach and sticky navigation

### Interactive Features
- **Voice visualization demo** with animated waveform bars in the hero section
- **Interactive diagnostic chat simulation** with branching conversation flows
- **Form handling** through Formspree for lead generation and demo requests
- **Mobile-responsive navigation** with Alpine.js-powered hamburger menu

## External Dependencies

### Third-party Services
- **Formspree** for form submission handling (demo requests, contact forms)
- **Google Analytics** (G-28WMV6CTFP) for website tracking and analytics
- **Google Fonts** for Roboto and Montserrat typography
- **Alpine.js CDN** for interactive JavaScript functionality

### Development Dependencies
- **Node.js** runtime environment
- **Express.js** web server framework
- **Tailwind CSS** utility-first CSS framework
- **Autoprefixer** and **PostCSS** for CSS processing
- **Markdown-it** for markdown parsing
- **Front-matter** library for YAML metadata parsing
- **Gray-matter** as additional front-matter processor