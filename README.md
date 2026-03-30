# CalorieTrack 🔥

App de seguimiento de calorías con Next.js 15, TypeScript, MongoDB, NextAuth y React Query.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: NextAuth.js v4 (Credentials Provider + JWT)
- **BD**: MongoDB + Mongoose
- **Estado servidor**: @tanstack/react-query v5
- **UI**: shadcn/ui + Tailwind CSS + Lucide React
- **Validación**: Zod
- **TypeScript**: estricto

## Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   ← NextAuth handler
│   │   └── users/register/route.ts       ← POST registro
│   ├── login/page.tsx                    ← Página login (pública)
│   ├── register/page.tsx                 ← Página registro (pública)
│   └── dashboard/
│       ├── layout.tsx                    ← Layout protegido (server)
│       └── page.tsx                      ← Dashboard principal
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                 ← Form con validación Zod
│   │   └── RegisterForm.tsx              ← Form multi-step (3 pasos)
│   ├── dashboard/
│   │   └── DashboardSidebar.tsx          ← Sidebar con signOut
│   ├── providers/
│   │   ├── AuthProvider.tsx              ← SessionProvider wrapper
│   │   └── QueryProvider.tsx             ← React Query provider
│   └── ui/                              ← Componentes shadcn
├── hooks/
│   ├── use-login.ts                      ← useMutation → signIn
│   ├── use-register.ts                   ← useMutation → POST /api/users/register
│   └── use-toast.ts                      ← Toast hook
├── lib/
│   ├── auth.ts                           ← NextAuth authOptions
│   ├── mongodb.ts                        ← Conexión singleton Mongoose
│   ├── utils.ts                          ← cn()
│   └── validations.ts                    ← Schemas Zod
├── models/
│   └── User.ts                           ← Modelo Mongoose IUser
└── types/
    └── next-auth.d.ts                    ← Extensión Session con id
```

## Flujo de autenticación

```
Usuario → /login → LoginForm
         → useLogin (useMutation)
           → signIn("credentials", { email, password })
             → NextAuth authorize()
               → connectDB() + User.findOne()
               → bcrypt.compare()
             → JWT { id, email, name }
         → redirect("/dashboard")

         ┌─ /dashboard/layout.tsx ─────────────────────┐
         │  getServerSession(authOptions)               │
         │  if (!session) redirect("/login")            │
         │  <DashboardSidebar user={session.user} />    │
         └──────────────────────────────────────────────┘
```

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
# También necesitas:
npm install tailwindcss-animate
```

### 2. Variables de entorno

Copia `.env.local.example` a `.env.local` y rellena:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/calorie-app
NEXTAUTH_SECRET=genera-uno-con-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

### 3. Correr en desarrollo

```bash
npm run dev
```

Visita:
- `http://localhost:3000/login` → Login
- `http://localhost:3000/register` → Registro (3 pasos)
- `http://localhost:3000/dashboard` → Dashboard (requiere sesión)

## Protección de rutas

| Ruta | Acceso |
|------|--------|
| `/login` | Público (redirige a /dashboard si hay sesión) |
| `/register` | Público (redirige a /dashboard si hay sesión) |
| `/dashboard/*` | Protegido (redirige a /login si no hay sesión) |

La protección se hace en **Server Components** con `getServerSession()` — sin middleware adicional.

## Extender el Dashboard

El `dashboard/page.tsx` usa datos de placeholder. Para conectar datos reales:

```ts
// Ejemplo: obtener datos del usuario autenticado
const user = await User.findOne({ email: session.user.email }).lean();
const dailyCalorieGoal = calculateTDEE(user); // implementa tu fórmula TDEE
```
