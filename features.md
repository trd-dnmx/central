# DNMX Clan Headquarters — Features List

Below is a detailed breakdown of all features implemented on the DNMX Clan Headquarters website.

## 1. Authentication & Role System
- **Firebase Auth Integration**: Secure authentication using Google Sign-In.
- **Role-Based Access Control (RBAC)**:
  - **Admins**: Members whose emails are whitelisted in `ADMIN_EMAILS` (e.g., leaders and key advisors). Admins can assign tasks, edit/delete tasks, post announcements, delete announcements, and view direct completion proof tables.
  - **Normal Members**: Authenticated users who can view information, access chat, upload media memories, and submit task completion details via external forms.
  - **Guests**: Unauthenticated users who have read-only access to public pages (Home, Hierarchy, Rules, Councils, Announcements) but cannot chat or submit proof.

## 2. Dynamic Real-Time Chat System
- **Multi-View Panel**: Toggled via a custom header button. Displays a user list with real-time status indicators (Online/Offline) and active chat room threads.
- **Direct Messaging**: Private real-time messages between authenticated clan members.
- **Markdown & Discord Formatting**: Supports styling flags (`**bold**`, `*italics*`, `__underline__`, `~~strikethrough~~`, inline code, multi-line code blocks, single/multi-line blockquotes, and spoilers).
- **Media Previews & Drag-and-Drop**: Allows drag-and-drop or file uploads of previewable images/videos before sending.
- **Typing Indicators**: Real-time visual typing indicator for active rooms.

## 3. Task Management Board
- **Task Categories**: Tasks sorted under *grinding*, *building*, *fighting*, *support*, and *defense*.
- **Admin Utilities**:
  - Assign new tasks with categories, titles, bodies, and images.
  - Edit or delete existing tasks.
  - View completion sheets directly inside the dashboard.
- **Google Sheets integration**: Redirection for admins to view proof spreadsheets.
- **Member Redirection**: Non-admin members clicking "Task Completed" are routed to the official Google Form proof submissions.

## 4. official Announcements Feed
- **Dynamic Notices Feed**: Real-time notices/updates compiled from Firestore.
- **Category Filter Chips**: Filter announcements by *updates*, *events*, *alerts*, *recruitment*, or *decrees*.
- **Discord Syntax Formatting**: Announcements support Discord-style markdown tags for structured and clean styling.
- **Admin Controls**: Creation form for publishing featured and standard announcements.

## 5. Clan Hierarchy & Profiles
- **Rank Directory**: Categorized directory showing 15 rank tiers (from Recruits to Monarchs).
- **Rank Profiles**: Intersecting modal detailing the rank name, tier, power/authority, requirements, and background description.
- **Councils Directory**: Dedicated directories for the *Executive Council* and *Management Council* showing detailed profiles of leaders, including playstyles, responsibilities, and custom profile pictures.

## 6. Archives & Memories
- **Real-Time Photo Gallery**: Storage of screenshots, memories, and event logs.
- **Upload Feature**: Authenticated users can upload screenshots of clan achievements directly to the archives.
- **Live Search**: Client-side filtering to search memories by name/description.

## 7. Interactive UX & Styling
- **Premium Gamified Aesthetics**: Deep crimson and cyan neon-colored design system with modern typography (Cinzel, Rajdhani, Orbitron).
- **Loading Screen**: Preloader that matches initializing states.
- **Ambient Canvas Particles**: Dynamic drifting particle fields overlaying the hero section.
- **Fully Responsive**: Hamburger menus and mobile-first responsive scaling across all page viewports.
