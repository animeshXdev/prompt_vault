# 🚀 PromptVault — Your Personal AI Prompt Manager

**Save smarter. Organize better. Prompt faster.**

PromptVault is a modern, private, full-stack AI prompt management application built with Next.js. It helps you store, organize, edit, reuse, and manage your AI prompts in one beautiful, secure workspace.

Whether you're a developer, designer, content creator, or AI enthusiast, PromptVault makes it easy to manage your growing collection of prompts without losing important instructions or rewriting the same prompts repeatedly.

---

## ✨ Why PromptVault?

Working with AI tools often means writing complex instructions, managing multiple projects, and repeatedly copying the same prompts.

Prompts can easily become scattered across chats, notes, documents, and different applications.

**PromptVault solves this by giving you one centralized place to manage your prompts.**

With PromptVault, you can:

- 📁 **Stay organized** — Keep prompts inside folders, categories, and project workspaces.
- ⚡ **Save time** — Reuse your best prompts instead of writing them again.
- 📝 **Edit easily** — Create and refine prompts using a professional editor.
- 🔄 **Track changes** — Maintain prompt versions and restore previous instructions.
- 🧩 **Build powerful prompts** — Combine master instructions, reusable rules, and task-specific prompts.
- 🔍 **Find anything** — Quickly search your saved prompts.
- 🔒 **Stay private** — Protect your personal prompt library with secure login.
- 💾 **Own your data** — Store your prompts locally using SQLite.

---

## 🌟 Key Features

### 📊 Smart Dashboard
Get a complete overview of your prompt collection, including saved prompts, favorites, workspaces, recent activity, and usage statistics.

### 📝 Prompt Management
Create, edit, duplicate, organize, archive, and delete prompts. Copy any saved prompt instantly with a single click.

### 📂 Folders & Categories
Organize prompts into folders, subfolders, categories, and tags to keep everything easy to navigate.

### 🗂️ Project Workspaces
Create separate workspaces for different projects, technologies, or workflows. Keep project-specific instructions, prompts, and references together.

### 🧠 Master Prompts
Store reusable instructions, coding standards, project rules, and other guidelines that you frequently use with AI tools.

### 🧩 Prompt Composer
Combine multiple prompts, master instructions, and reusable blocks into one structured prompt.

### ⚙️ Dynamic Prompt Templates
Create reusable templates using variables such as `{{project_name}}`, `{{framework}}`, and `{{task}}`. Fill in the variables to generate personalized prompts.

### 🕒 Version History
Track prompt changes, compare revisions, and restore previous versions without losing your original instructions.

### 🔎 Advanced Search
Find prompts using keywords, tags, categories, workspaces, favorites, and other filters.

### 📎 Reference Attachments
Keep useful documents and reference files alongside your prompts for easier project management.

### 🤖 AI-Powered Tools
Configure supported AI providers to improve prompts, generate suggestions, and test instructions. AI features are optional.

### 📥 Import & Export
Import existing prompts and export your collections for backup, migration, or reuse.

### 🌙 Premium User Experience
Enjoy a modern, responsive dashboard with dark and light themes, intuitive navigation, and a clean editing experience.

### 🔐 Private Authentication
PromptVault is designed for personal use with a single administrator login. There is no public registration system, and the password can be changed from application settings.

---

## 🛠️ Built With

- **Next.js** — Full-stack application framework
- **React & TypeScript** — Interactive, type-safe application
- **Tailwind CSS 4** — Modern responsive styling
- **shadcn/ui** — Professional interface components
- **SQLite** — Lightweight local database
- **Prisma ORM** — Database management
- **CodeMirror** — Prompt editing experience
- **Lucide React** — Modern icons

No separate backend server or external database service is required.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/animeshXdev/prompt_vault.git
cd prompt_vault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and configure your database, administrator credentials, and required secrets.

```env
DATABASE_URL="file:./dev.db"
ADMIN_EMAIL="admin@example.com"
ADMIN_DEFAULT_PASSWORD="your-secure-password"
SESSION_SECRET="your-long-random-secret"
```

Use the actual environment variable names required by your installed version of PromptVault.

### 4. Initialize the Database

```bash
npx prisma migrate deploy
```

Run the project's administrator initialization command if it is not handled automatically.

### 5. Start PromptVault

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

Sign in using the administrator credentials configured during setup.

---

## 📖 How to Use PromptVault

**Step 1 — Sign in**

Open PromptVault and log in using your configured administrator email and password.

**Step 2 — Create your first prompt**

Navigate to All Prompts and select Create Prompt. Enter a title, description, and prompt content, then save it.

**Step 3 — Organize your collection**

Create folders, categories, and tags. Group related prompts together so they are easier to find.

**Step 4 — Create project workspaces**

Set up separate workspaces for different projects. Add your project instructions, references, and reusable prompts.

**Step 5 — Create master instructions**

Save the instructions you use repeatedly, such as coding guidelines, design requirements, or preferred output formats.

**Step 6 — Build reusable templates**

Create templates with dynamic variables. Enter values when needed to generate complete prompts quickly.

**Step 7 — Use the Prompt Composer**

Select saved prompts, master instructions, and task requirements to create a combined prompt.

**Step 8 — Copy and use your prompt**

Copy the generated prompt and paste it into ChatGPT, Claude, Gemini, or another AI tool.

**Step 9 — Manage and improve**

Edit your prompts, maintain version history, mark useful prompts as favorites, and archive anything you no longer use regularly.

**Step 10 — Back up your data**

Use the available export and backup tools to preserve your prompt collection.

---

## 🎯 Who Is PromptVault For?

- **Developers** — Manage coding prompts, debugging instructions, API requirements, and development standards.
- **Designers** — Save UI/UX prompts, design guidelines, and creative instructions.
- **Content Creators** — Organize writing, marketing, and social media prompts.
- **AI Enthusiasts** — Build and maintain a personal library of effective prompts.
- **Freelancers** — Keep client-specific prompts and project instructions organized.
- **Researchers** — Store structured research instructions and reusable analysis templates.

---

## 🔒 Privacy & Security

PromptVault is designed as a private, single-user application.

- No public signup or registration.
- Password-protected access.
- Password changes through Settings.
- Local SQLite database.
- Private prompt and attachment management.
- Optional AI integrations.
- No AI API key required for basic prompt management.

Keep your `.env` file, SQLite database, credentials, and private backups out of public repositories.

For production deployment, use hosting with persistent storage for SQLite and uploaded files.

---

## 💡 The Idea Behind PromptVault

**Your prompts are valuable. They deserve more than a temporary chat history or a scattered collection of notes.**

PromptVault gives your prompts a permanent home where they can be organized, improved, versioned, and reused whenever you need them.

Spend less time searching for old instructions and more time building with AI.

---

## 👨‍💻 Author

Developed by **Animesh Prakash**

GitHub: [@animeshXdev](https://github.com/animeshXdev)

---

## ⭐ Support

If you find PromptVault useful, consider giving the repository a star on GitHub.

**PromptVault — One place for every prompt.**
