# **App Name**: BizAssistant

## Core Features:

- Onboarding: Simple onboarding flow to collect business information: phone number, business name, business type, currency, and role (owner/staff).
- Record Sale: Quick sale recording screen allowing to select a product OR manually enter an amount; select payment type (cash/transfer/POS) and confirm the sale. The sale is saved offline first and synced when the internet is available.
- Home Screen (Owner): A screen that enables business owners to view three actions - ask about their business, record sale, view today's summary and add staff
- Home Screen (Staff/Cashier): Clean interface focusing on recording a sale without access to revenue totals and trends.
- AI Business Insights: Chat interface to ask about business performance and receive short answers with clear numbers. The LLM is acting as a tool, accessing recent data for the current business.
- Staff Management: Add and manage staff via phone number and toggle permissions: Can record sales, can see reports (owner only).
- Offline Caching: Cache today's data locally for quick access and offline functionality. Synchronization with the server when internet connectivity is available.

## Style Guidelines:

- Primary color: Deep blue (#1A237E) to inspire calm and trust, fitting for financial applications.
- Background color: Very light blue (#F0F4FF), almost white, providing a clean and calm background.
- Accent color: Muted purple (#7953D2), clearly distinct from the primary color but still in the blue-purple range, offering a professional feel. This will be the 'success' color as well.
- Font: 'System default' sans-serif fonts for maximum compatibility and simplicity on older Android phones.
- Use of large buttons and minimal on-screen elements for ease of use on mobile devices.
- Use of very simple icons where needed. All iconography to be filled rather than outlined.
- No animations.