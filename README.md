# Scholaris

Scholaris is an educational AI tutor built with Next.js. It helps students work through problems one step at a time instead of handing over final answers.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenRouter via `src/app/api/chat/route.ts`

## Features

- Tutor chat at `/chat`
- Toggleable math tools for quick input
- KaTeX math rendering for student and tutor messages
- On-demand graph drawer for plotting expressions in `x`
- Chat sidebar with create and delete actions
- Local chat saving in the browser
- Reusable `sendChatMessage` helper
- Provider abstraction so Ollama can be added later
- Scholaris system prompt with tutoring guardrails
- Loading and error states
- No database

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a root `.env.local` file:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
AI_PROVIDER=openrouter
AI_MODEL=openrouter/auto
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000). It redirects to `/chat`.

## Math Input

Scholaris supports natural math entry in the chat box. Use the toolbar above the input to insert common notation like:

- `x²`
- `xⁿ`
- `√()`
- `( )⁄( )`
- `π`
- `log()`
- `ln()`
- `|x|`
- `≤`
- `≥`

Example inputs:

- `√(16) + x²`
- `y = x² - 4x + 3`
- `(x + 1) / (x - 2) <= 4`

Use the `ƒx` button to open or close the math tools. Student and tutor math expressions are rendered cleanly in chat when Scholaris can recognize them.

## Graph Feature

The `/chat` page includes a graph tool that stays hidden until you open it.

Open it with the `Graph` button near the input, or when Scholaris says a graph would help.

You can enter examples like:

- `y = 2x + 3`
- `y = x^2`
- `y = x^2 - 4x + 3`

The graph supports:

- Linear functions
- Quadratic functions
- Simple expressions in `x`
- Interactive pan and zoom

If a function cannot be graphed, Scholaris shows a clear error message in the graph drawer.

## Chat Saving

- Chats stay in the current browser using local storage.
- You can create or delete chats from the left sidebar.

## Environment Variables

- `OPENROUTER_API_KEY`: required for chat requests
- `AI_PROVIDER`: set to `openrouter`
- `AI_MODEL`: defaults to `openrouter/auto`

If `OPENROUTER_API_KEY` is missing, the chat UI shows a warning and the API returns a clear error message.

## Project Structure

```txt
src/
  app/
    api/chat/route.ts
    chat/page.tsx
    layout.tsx
    page.tsx
  components/
    chat/chat-shell.tsx
  lib/
    ai/
      providers/
      scholaris-system-prompt.ts
      send-chat-message.ts
      types.ts
```

## Notes

- The OpenRouter request is handled on the server, so the API key is never exposed to the browser.
- The current provider abstraction supports OpenRouter now and leaves a clean path for Ollama later.
- Scholaris is intentionally designed to coach students with hints, structure, and next-step questions rather than finished submissions.
