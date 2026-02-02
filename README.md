# Basar AI 🎨

> Multi-brand SaaS platform for AI-powered social media image generation

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)

Basar AI enables users to manage multiple brand identities and generate stunning social media images using OpenAI and Gemini AI providers. Built with a **BYOK (Bring Your Own Key)** model for maximum flexibility and cost control.

---

## 🌟 Features

- **Multi-Brand Management** - Create and manage multiple brand identities with isolated workspaces
- **AI Image Generation** - Leverage OpenAI DALL-E and Google Gemini for image creation
- **Brand Kit Interview** - Capture brand identity through an intuitive interview flow
- **Generation History** - First-class history view with filtering by brand and provider
- **BYOK Model** - Use your own API keys (no billing in MVP)
- **Secure by Design** - Row-level security (RLS) and vault-based key storage
- **Platform Presets** - Generate images optimized for different social media platforms

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router ⚠️ *Note: Using Next.js 15, not 14 or 16*
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Redux Toolkit](https://redux-toolkit.js.org/)** - State management
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible UI components
- **[Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)** - Authentication & database client

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[Supabase](https://supabase.com/)** - Authentication, PostgreSQL database, Vault (secrets), Storage
- **[OpenAI API](https://platform.openai.com/)** - DALL-E image generation
- **[Gemini API](https://ai.google.dev/)** - Google's image generation

### Infrastructure
- **[Bunny Magic Containers](https://bunny.net/)** - Hosting platform
- **PostgreSQL** - Primary database (via Supabase)
- **Supabase Storage** - Generated image storage

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js 15 Frontend                 │
│              (App Router + TypeScript + Redux)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────┐
│                    FastAPI Backend                      │
│              (Python + Pydantic + Async)                │
└─────┬──────────────┬──────────────────┬─────────────────┘
      │              │                  │
      │              │                  │
┌─────▼─────┐  ┌────▼─────┐     ┌──────▼──────┐
│  Supabase │  │ OpenAI   │     │   Gemini    │
│  (Auth,   │  │   API    │     │     API     │
│   DB,     │  │          │     │             │
│  Vault,   │  └──────────┘     └─────────────┘
│  Storage) │
└───────────┘
```

### Key Architectural Principles

✅ **Brand Isolation** - Every resource belongs to exactly one brand  
✅ **Hard Delete** - Database rows AND storage assets are removed on deletion  
✅ **Key Secrecy** - API keys stored in Supabase Vault, never logged or sent to client  
✅ **RLS Everywhere** - Row-level security enabled on all tables  
✅ **Server-side AI Calls** - Client never calls AI providers directly  

For complete architectural details, see [Implementation Plan](docs/implementation-plan.md) and [Constitution](.specify/memory/constitution.md).

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.17+ (for Next.js 15)
- **Python** 3.9+ (for FastAPI backend)
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **OpenAI API Key** (optional, for DALL-E)
- **Gemini API Key** (optional, for Gemini)

### 1. Clone the Repository

```bash
git clone https://github.com/amElnagdy/basarai.git
cd basarai
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials

# Run development server
uvicorn app.main:app --reload
```

Backend API will be available at `http://localhost:8000`

### 4. Database Setup

```bash
# Run migrations (when available)
cd database
# Migration commands will be added here
```

---

## 📁 Project Structure

```
basarai/
├── frontend/              # Next.js 15 application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities & Supabase client
│   │   └── store/        # Redux store
│   ├── public/           # Static assets
│   └── package.json
│
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── models/      # Pydantic models
│   │   ├── services/    # Business logic
│   │   └── main.py      # App entry point
│   └── requirements.txt
│
├── database/            # SQL migrations & schema
│   └── migrations/
│
├── docs/                # Documentation
│   └── implementation-plan.md
│
└── .specify/            # Project constitution & templates
    └── memory/
        └── constitution.md
```

---

## 🤝 Contributing

We welcome contributions! This project is in early development phase.

### Development Workflow

This project uses **SpecKit** methodology for structured development:

1. **Specify** - Create feature specifications
2. **Plan** - Generate implementation plans
3. **Tasks** - Break plans into actionable tasks
4. **Implement** - Execute with checklist validation

See [`.claude/commands/`](.claude/commands/) for available workflow commands.

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the constitution** - Read [constitution.md](.specify/memory/constitution.md)
4. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Before Submitting PRs

Ensure your feature meets the **Definition of Done**:

- [ ] Works for brand with 0 brand kit answers
- [ ] Works for brand with completed brand kit
- [ ] Works with OpenAI provider
- [ ] Works with Gemini provider
- [ ] RLS policies tested OR explicit integration checks documented
- [ ] Hard delete verified: database rows AND storage assets removed

---

## 📚 Documentation

- **[Implementation Plan](docs/implementation-plan.md)** - Detailed technical architecture
- **[Constitution](.specify/memory/constitution.md)** - Core principles & constraints
- **[SpecKit Commands](.claude/commands/)** - Development workflow tools

---

## 🔒 Security & Privacy

- **Row-Level Security (RLS)** enforced on all database tables
- **API keys** stored in Supabase Vault (encrypted at rest)
- **No key logging** - Provider keys never appear in logs or client-side
- **Brand isolation** - Strict data separation between brands
- **Server-side API calls** - Client never directly accesses AI providers

---

## 📄 License

[License information to be added]

---

## 🙏 Acknowledgments

Built with modern tools and best practices:
- Next.js team for the amazing framework
- Supabase for the complete backend platform
- OpenAI & Google for powerful AI capabilities
- The open-source community

---

## 📞 Contact & Support

- **GitHub Issues** - [Report bugs or request features](https://github.com/amElnagdy/basarai/issues)
- **Discussions** - [Ask questions or share ideas](https://github.com/amElnagdy/basarai/discussions)

---

**Built with ❤️ for creators who need beautiful social media images**
