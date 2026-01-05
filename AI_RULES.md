# 🤖 Diretrizes de Desenvolvimento (AI Rules) - ZapMenu

Este documento define a stack tecnológica e as regras de arquitetura para o desenvolvimento do ZapMenu. Siga estas diretrizes rigorosamente.

## 🚀 Tech Stack

- **Framework**: React 19 com TypeScript para uma base de código tipada e segura.
- **Backend-as-a-Service**: Supabase para banco de dados (PostgreSQL), autenticação e persistência.
- **Estilização**: Tailwind CSS para design responsivo e utilitário.
- **Ícones**: Lucide React para toda a iconografia do sistema.
- **Build Tool**: Vite para desenvolvimento rápido e bundles otimizados.
- **Processamento de Imagem**: API de Canvas nativa para compressão e redimensionamento de imagens (client-side).
- **Roteamento**: Atualmente baseado em estado e Hash (#), mas com orientação para transição para React Router.
- **Componentes**: Biblioteca customizada em `src/components/ui.tsx` focada em UX mobile-first.

## 🛠 Regras de Uso de Bibliotecas

### 1. UI e Estilização
- Utilize prioritariamente os componentes definidos em `src/components/ui.tsx` (Button, Input, Card, Modal).
- Todo novo componente deve ser responsivo (mobile-first), utilizando classes do Tailwind.
- Para novos componentes complexos, siga o padrão de design do shadcn/ui.

### 2. Gerenciamento de Dados
- **NUNCA** chame o Supabase diretamente nos componentes. Use sempre a abstração em `src/services/db.ts`.
- Mantenha as interfaces de tipos atualizadas em `src/types.ts` ao modificar o esquema do banco de dados.

### 3. Ícones e Assets
- Use exclusivamente `lucide-react`. Não instale bibliotecas de ícones adicionais (como FontAwesome ou HeroIcons) sem necessidade extrema.
- Imagens enviadas pelo usuário devem passar pela função `processImage` antes de serem salvas para garantir otimização.

### 4. Estado e Navegação
- Utilize `useState` e `useEffect` para lógica local.
- A navegação entre visões (Admin, Manager, Customer) deve ser gerenciada no `App.tsx`.

### 5. Formatação e Helpers
- Para valores monetários, utilize a lógica de `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Mantenha as mensagens de interface em **Português (Brasil)**.

## 📂 Organização de Arquivos
- `src/components/`: Componentes reutilizáveis pequenos.
- `src/views/`: Telas completas e fluxos de dashboard.
- `src/services/`: Lógica de API e integração com serviços externos.
- `src/types.ts`: Definições globais de interfaces e tipos.