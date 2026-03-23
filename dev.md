# Desktop Screen Assistant Quill — dev.md

## 1. Product Definition

### Product Summary

A desktop AI assistant built with Electron + Next.js that opens as a pinned, minimizable sidebar. The user manually captures a full-screen screenshot from a selected monitor, then asks questions in a chat interface. The AI answers based on the screenshot and the ongoing chat context. A chat can contain multiple screenshots over time, and each screenshot belongs to a specific point in the conversation timeline.

### Core Product Goal

Remove the friction of manually taking screenshots, uploading them elsewhere, and re-explaining context to an AI assistant.

### Product Principles

* Chat-first UX
* Manual screenshot capture only (click of a button)
* Sidebar assistant experience
* Convenience-first history
* High-quality responses over speed
* Screenshot + chat timeline memory
* Guest usage allowed
* Soft usage warning followed by hard cap

---

## 2. Locked Product Decisions

### UX / Interaction

* App opens as a right sidebar assistant
* Sidebar stays pinned and can be minimized
* User clicks a **Screenshot** button to capture context
* User selects which monitor to capture
* V1 captures **full screen only**
* Screenshot becomes part of the active chat timeline
* User types messages manually, like ChatGPT
* Follow-up messages in the same chat retain memory
* User can add another screenshot into the same chat
* **New Chat** creates a fresh conversation with no previous memory

### Chat Behavior

* Chats have history
* Chats store both:

  * screenshots
  * text messages
* Chats behave as a timeline
* Each screenshot is tied to a specific moment in the chat
* AI should use chat history and the relevant screenshot context to answer correctly

### Intelligence / Responses

* Responses should feel like ChatGPT
* Free-form response style
* Prioritize smarter, higher-quality answers over speed

### Usage / Limits

* Frequent daily usage expected
* Usage tracked internally by tokens for now
* Show soft warning before limit
* Enforce hard stop after cap is reached

### Access Model

* Guest mode supported
* Authenticated mode supported
* Guest users must still be tracked for usage and limits

### Privacy / Storage

* Convenience-first approach
* Screenshots are stored in chat history
* Users should be able to reopen old chats and see screenshots again

---

## 3. V1 User Flow

### Main Flow

1. User opens the app
2. Sidebar appears on the right
3. User clicks **Screenshot**
4. User selects the monitor
5. App captures the full screen
6. Screenshot is added to the current chat timeline
7. User types a question
8. Backend sends screenshot + relevant chat context + new message to AI provider
9. AI response is shown in the sidebar
10. User continues asking follow-ups in the same chat
11. If user wants updated context in the same chat, they click **Screenshot** again
12. If user wants a separate conversation, they click **New Chat**

### Chat Timeline Example

* Screenshot A added
* User asks question 1
* AI responds
* User asks follow-up question 2
* AI responds
* Screenshot B added in same chat
* User asks question 3 about new screen state
* AI responds using updated context

---

## 4. Scope

### In Scope for V1

* Electron desktop shell
* Next.js UI inside Electron
* Right sidebar assistant
* Screenshot button
* Monitor selection
* Full-screen capture only
* Chat UI
* New Chat button
* Chat history
* Multiple screenshots inside one chat
* Screenshot + message timeline
* AI integration through backend
* Guest mode
* Authenticated mode
* Token usage tracking
* Soft warning + hard cap
* Screenshot storage
* Basic settings

### Out of Scope for V1

* Continuous screen watching
* Auto-capture without user action
* Region selection capture
* OCR-specific pipeline outside model capabilities
* App control / desktop automation
* Proactive AI interruptions
* Multi-user collaboration
* Rich prompt templates / quick actions
* Fine-grained enterprise permission controls

---

## 5. Recommended High-Level Tech Stack

### Desktop App

* Electron
* Next.js
* React
* TypeScript
* Tailwind CSS
* Zustand for local UI/app state

### Backend

* Node.js
* Express
* TypeScript
* Zod for validation

### Database / Storage / Auth

* Supabase Auth
* Supabase Postgres
* Supabase Storage

### Payments

* Stripe

### AI Layer

* Provider abstraction layer
* OpenAI or OpenRouter behind common interface

### Monitoring / Reliability

* Sentry
* Basic structured logging

---

## 6. Architecture Overview

### Desktop Layer Responsibilities

Electron handles:

* native window management
* pinned/minimizable sidebar
* monitor detection
* screenshot capture
* local guest device ID storage
* app startup behavior
* optional keyboard shortcuts later

### Frontend Layer Responsibilities

Next.js renderer handles:

* chat interface
* screenshot preview in timeline
* message rendering
* loading and error states
* chat list/history UI
* auth screens
* settings UI
* usage warning UI

### Backend Layer Responsibilities

Express handles:

* guest/user identity resolution
* auth verification
* chat CRUD
* screenshot upload flow
* AI request construction
* provider routing
* token logging
* limit enforcement
* billing integration

### Data Layer Responsibilities

Supabase/Postgres/Storage handle:

* users
* guest devices
* chats
* messages
* screenshots
* usage logs
* subscriptions
* settings

---

## 7. Identity Model

### Identity Types

There are 2 supported identities:

#### Guest User

* no account required
* tracked with local `device_id`
* limited usage
* history tied to device
* upgrade path to full user later

#### Authenticated User

* account-based
* login/signup through Supabase Auth
* full persistent history
* subscription support
* sync across installs/devices if desired later

### Device ID Requirements

For guest mode, Electron should generate and locally persist a unique `device_id`.

This `device_id` must be sent with backend requests whenever there is no logged-in user.

---

## 8. Core Data Model

### users

* id
* email
* created_at
* updated_at

### guest_devices

* id
* device_id
* created_at
* last_seen_at
* is_blocked

### chats

* id
* owner_type (`user` or `guest`)
* owner_id
* title
* created_at
* updated_at

### messages

* id
* chat_id
* role (`user`, `assistant`, `system`)
* content
* created_at

### screenshots

* id
* chat_id
* message_id (nullable until linked, then required)
* storage_path
* public_or_signed_url
* monitor_label
* created_at

### documents

* id
* chat_id
* filename
* mime_type
* extension
* size_bytes
* storage_path
* public_or_signed_url
* extraction_status (`pending`, `ready`, `failed`)
* extraction_error
* created_at
* updated_at

### document_chunks

* id
* document_id
* chunk_index
* content
* token_estimate
* metadata
* created_at

### message_screenshot_links

Use this if needed instead of a direct `message_id` on screenshots.

* id
* message_id
* screenshot_id

### usage_logs

* id
* owner_type (`user` or `guest`)
* owner_id
* provider
* model
* input_tokens
* output_tokens
* total_tokens
* request_type
* created_at

### subscriptions

* id
* user_id
* stripe_customer_id
* stripe_subscription_id
* plan_name
* status
* current_period_start
* current_period_end
* created_at
* updated_at

### settings

* id
* owner_type (`user` or `guest`)
* owner_id
* theme
* sidebar_pinned
* sidebar_minimized
* created_at
* updated_at

---

## 9. Chat Timeline Rules

### Timeline Rules

* A chat is a chronological sequence of screenshots and messages
* A screenshot belongs to a specific point in the chat timeline
* Messages after a screenshot may rely on that screenshot until another screenshot is added
* Multiple screenshots can exist in the same chat
* Opening an old chat should show both the messages and associated screenshots

### Context Rule

For V1, when building the AI request:

* include recent chat history
* include the most recent screenshot relevant to the current turn
* optionally include prior screenshot references if needed later

### New Chat Rule

* **New Chat** starts with no previous conversation memory
* Old chats remain accessible in chat history

---

## 10. AI Request Strategy

### Backend AI Request Inputs

Each request should include:

* relevant recent messages from the chat
* current user message
* latest screenshot for that point in the timeline
* any required system prompt/instructions

### AI Request Notes

* Do not send the entire lifetime history every time
* Start with a rolling context window, for example:

  * latest screenshot
  * last 6–10 messages
* Keep provider integration abstracted

### Provider Abstraction Interface

Create an internal service such as:

* `analyzeChatWithScreenshot()`

Implementations:

* `OpenAIProvider`
* `OpenRouterProvider`

The rest of the backend should not care which provider is active.

---

## 11. Storage Strategy

### Screenshot Storage

Because convenience-first history is required, screenshots must be stored.

Recommended storage:

* Supabase Storage for V1 simplicity

### Storage Flow

1. Electron captures screenshot
2. Frontend sends screenshot to backend
3. Backend validates and uploads to storage
4. Backend stores screenshot record in database
5. Backend links screenshot to chat timeline
6. Backend sends image + chat context to AI provider

### Requirements

* support secure upload handling
* support deletion later
* support retrieving stored screenshots for old chats

### Document Storage

Uploaded documents are chat-scoped and retained for reuse in later questions within the same chat.

Recommended storage:

* Supabase Storage bucket for documents
* Postgres metadata row in `documents`
* Parsed chunk rows in `document_chunks`

### Document Processing Flow

1. Desktop uploads document payload (base64 + metadata)
2. Backend validates file type and size
3. Backend stores original file in storage and metadata in `documents`
4. Backend extracts text by file type (PDF/DOCX/XLSX/CSV/text-like)
5. Backend chunks extracted text and stores chunks in `document_chunks`
6. Ask flow ranks relevant chunks and injects bounded context into provider request

---

## 12. Usage and Limit Logic

### Internal Tracking Unit

* tokens

### User Experience

* warn user when nearing limit
* stop requests when hard cap is reached

### Enforcement Logic

Backend must:

* track usage on every AI request
* aggregate usage by guest device or user
* check plan/limit before processing new requests

### Required V1 Behaviors

* guest cap
* authenticated free cap
* paid cap or generous allowance later

---

## 13. Auth Strategy

### V1 Auth Choice

* Supabase Auth for registered users
* custom guest identity via `device_id`

### Required Auth Flows

* continue as guest
* sign up
* log in
* log out
* guest continues using app with usage cap
* later support guest-to-user upgrade path

### Guest Upgrade Requirement

When a guest creates an account later, decide whether guest chats/history should be merged into the new account.

V1 recommendation:

* build data ownership so merge is possible later

---

## 14. Payment Strategy

### Payment Provider

* Stripe

### Billing Goals

* support future free + paid plans
* unlock more usage for paid users
* sync subscription state into backend

### Required Stripe Features

* checkout session
* customer portal
* webhook handling
* subscription status sync

### Backend Billing Responsibilities

* create Stripe customer for user
* listen to Stripe webhooks
* update local subscription state
* enforce plan-based usage rules

---

## 15. Security and Privacy Considerations

### Security Requirements

* AI provider keys only in backend
* validate uploads
* authenticate all protected routes
* securely store screenshots
* do not trust client-side token counts

### Privacy Requirements

Because screenshots are stored, app must clearly communicate:

* screenshots are saved in chat history
* old chats can be reopened
* user should be able to delete chats/screenshots later

### Minimum V1 Safety Rules

* no hidden screen watching
* no screenshot taken without explicit user action
* screenshot button is the only capture trigger in V1

---

## 16. Frontend State Design

### Suggested State Domains

* auth state
* guest device state
* current chat state
* chat list state
* screenshot upload state
* AI response loading state
* usage state
* settings state
* sidebar UI state

### Suggested State Tool

* Zustand

---

## 17. Suggested App Structure

```text
root/
  apps/
    desktop/
      electron/
        main/
        preload/
        utils/
      renderer/
        app/
        components/
        stores/
        lib/
    api/
      src/
        routes/
        controllers/
        services/
        providers/
        middleware/
        db/
        utils/
  packages/
    shared/
      types/
      schemas/
      constants/
```

### Folder Responsibilities

#### desktop/electron/main

* BrowserWindow setup
* sidebar behavior
* monitor enumeration
* screenshot capture triggers
* IPC registration

#### desktop/electron/preload

* secure bridge between renderer and Electron APIs

#### desktop/renderer

* Next.js UI
* chat UI
* history UI
* auth UI
* usage UI

**Document staging + timeline (client):**

* The composer treats **selected** documents as “included on the next Send”; a **Library** section lists other files in the chat so the user can toggle them in.
* Documents fetched from the API for a chat default to **unselected** so nothing is sent until the user opts in; **new uploads** default to **selected** for the next message.
* When the user sends a message, optional `attachedDocumentIds` / `attachedDocumentLabels` are stored on that **user** timeline entry so attachment **chips** render above the bubble in the scrollable timeline.
* After a **successful** `/ask` response, IDs that were sent are **deselected** in the composer so the following message does not reuse them unless the user selects them again.
* A paperclip control in the input row duplicates “Add file” for quick access.

#### api/src/providers

* OpenAI provider
* OpenRouter provider

#### api/src/services

* chat service
* screenshot service
* AI service
* usage service
* billing service

#### packages/shared

* shared Zod schemas
* shared TS types

---

## 18. API Surface (V1 Draft)

### Auth / Identity

* `POST /auth/guest/init`
* `GET /auth/me`

### Chats

* `GET /chats`
* `POST /chats`
* `GET /chats/:chatId`
* `POST /chats/:chatId/messages`

### Screenshots

* `POST /chats/:chatId/screenshots`

### Documents

* `GET /chats/:chatId/documents`
* `POST /chats/:chatId/documents`
* `DELETE /chats/:chatId/documents/:documentId`

### AI

* `POST /chats/:chatId/ask`

### Usage

* `GET /usage/me`

### Billing

* `POST /billing/create-checkout-session`
* `POST /billing/create-customer-portal-session`
* `POST /billing/webhooks/stripe`

---

## 19. Core Backend Services

### Chat Service

Responsibilities:

* create chat
* list chats
* fetch timeline
* append messages
* manage ownership

### Screenshot Service

Responsibilities:

* validate image input
* upload screenshot to storage
* create screenshot DB record
* attach screenshot to timeline
* fetch screenshot URLs for history

### Document Service

Responsibilities:

* validate uploaded document type/size/count limits
* upload original document to storage
* extract text based on file type
* split and persist retrieval chunks
* list/delete chat documents
* retrieve and rank relevant chunks per ask request

Supported formats (V1):

* PDF (`.pdf`)
* DOCX (`.docx`)
* XLSX (`.xlsx`)
* CSV (`.csv`)
* TXT (`.txt`)
* JSON (`.json`)
* Markdown (`.md`)

Limits (env-configurable):

* `MAX_DOCUMENT_SIZE_BYTES` (default 15MB per file)
* `MAX_DOCUMENTS_PER_CHAT` (default 25)
* `MAX_DOCUMENT_CONTEXT_CHUNKS` (default 6)
* `MAX_DOCUMENT_CONTEXT_CHARS` (default 12000)

### AI Service

Responsibilities:

* gather recent context
* gather relevant screenshot
* gather relevant document chunks
* build provider request
* receive response
* save assistant message
* report token usage

### Usage Service

Responsibilities:

* calculate current usage
* check limits before request
* write usage logs
* return warning thresholds

### Billing Service

Responsibilities:

* create Stripe checkout session
* handle Stripe webhooks
* sync subscription state

---

## 20. Electron Responsibilities in More Detail

### Main Window / Sidebar

* open right-side sidebar window
* keep pinned option
* minimize/restore
* remember window state

### Monitor Selection

* enumerate available displays
* allow user to select which monitor to capture

### Screenshot Capture

V1 requirements:

* full-screen capture only
* selected monitor only
* triggered by explicit screenshot button

### Local Persistent Values

* `device_id`
* sidebar preferences
* possibly last selected monitor

---

## 21. Build Phases

### Phase 0 — Repository and Foundations

Tasks:

* set up monorepo or multi-app structure
* set up TypeScript across desktop and backend
* define shared types/schemas
* choose package manager and workspace layout
* set up environment variable strategy

Deliverable:

* base project structure ready for implementation

---

### Phase 1 — Core Proof of Concept

Goal:
Prove the core product loop works locally.

Tasks:

* create Electron app shell
* render Next.js UI inside Electron
* build right sidebar layout
* add Screenshot button
* implement monitor selection
* capture full-screen screenshot from selected monitor
* build simple chat input/output UI
* send screenshot + prompt to Express backend
* backend calls one AI provider
* return and render response

Deliverable:

* working local prototype of screenshot → ask → answer

---

### Phase 2 — Chat Timeline UX

Goal:
Make the prototype behave like the real product.

Tasks:

* add chat message list
* add screenshot cards inside timeline
* add New Chat button
* maintain in-memory conversation state
* support multiple screenshots in one chat locally
* support follow-up messages using same local chat history

Deliverable:

* local app that behaves like intended product UX

---

### Phase 3 — Real Backend Structure

Goal:
Replace prototype backend with maintainable architecture.

Tasks:

* structure Express app
* add route/controller/service separation
* add Zod validation
* add provider abstraction
* add centralized error handling
* add request logging

Deliverable:

* production-oriented backend foundation

---

### Phase 4 — Database + Storage

Goal:
Persist chats, messages, screenshots.

Tasks:

* set up Supabase project
* create database schema
* create storage bucket(s)
* persist chats/messages/screenshots
* load old chats from backend
* reopen chat history with screenshots visible

Deliverable:

* real persistent history

---

### Phase 5 — Guest System

Goal:
Support guests with tracked usage.

Tasks:

* generate and persist `device_id` in Electron
* build guest initialization flow
* attach `device_id` to requests
* create guest ownership logic in backend
* tie chats/history to guest device

Deliverable:

* guest users can use app and retain local identity

---

### Phase 6 — Authentication

Goal:
Add registered accounts.

Tasks:

* integrate Supabase Auth
* build signup/login/logout UI
* protect authenticated routes as needed
* support both guest and user identities cleanly
* plan guest-to-user migration path

Deliverable:

* real account system

---

### Phase 7 — Usage Tracking and Limits

Goal:
Control cost and enforce plan limits.

Tasks:

* log usage per request
* store input/output tokens
* build usage aggregation logic
* implement soft warning threshold
* implement hard cap block
* show usage state in UI

Deliverable:

* usage control system

---

### Phase 8 — Billing

Goal:
Prepare monetization.

Tasks:

* integrate Stripe
* create checkout flow
* create billing portal flow
* process Stripe webhooks
* sync subscription state
* connect plan status to usage limits

Deliverable:

* paid plan support

---

### Phase 9 — Product Polish

Goal:
Make app launch-ready.

Tasks:

* improve loading states
* improve screenshot upload UX
* improve sidebar behavior
* add empty states
* add retry flows
* add delete chat flow
* add delete screenshot flow
* add basic settings
* add crash/error monitoring

Deliverable:

* MVP ready for external testing

---

## 22. Priority Task Checklist

### Must Build First

* [ ] Electron shell
* [ ] Sidebar UI
* [ ] Screenshot button
* [ ] Monitor selection
* [ ] Full-screen capture
* [ ] Prompt input
* [ ] AI response rendering

### Must Build Next

* [ ] Chat timeline
* [ ] New Chat
* [ ] Multiple screenshots in same chat
* [ ] Backend architecture cleanup

### Must Build Before Launch

* [ ] Persistent DB storage
* [ ] Screenshot storage
* [ ] Guest identity
* [ ] Usage limits
* [ ] Auth
* [ ] Basic billing wiring

---

## 23. Product Risks to Watch

### Cost Risk

Frequent screenshot + smart model usage can become expensive quickly.

Mitigation:

* limit usage
* monitor token consumption
* optimize prompt/context size

### Privacy / Trust Risk

Stored screenshots may contain sensitive user data.

Mitigation:

* explicit capture-only model
* clear user communication
* deletion controls
* secure storage

### UX Risk

If screenshot flow is slow or confusing, repeated daily usage will fail.

Mitigation:

* keep capture flow extremely simple
* make timeline visually clear
* show current context clearly

### Scope Risk

Too many extras too early may delay core value.

Mitigation:

* focus on screenshot + chat + memory first

---

## 24. Definition of MVP Success

The MVP is successful if a user can:

* open the sidebar quickly
* capture a selected monitor’s full screen
* ask a question naturally
* get a useful AI answer
* continue with follow-up questions in the same chat
* add another screenshot into the same chat
* create a new chat when needed
* revisit old chats and see both screenshots and conversation history

---

## 25. Immediate Next Implementation Order

1. Set up desktop shell and renderer
2. Build sidebar UI
3. Implement screenshot capture flow
4. Build minimal backend AI endpoint
5. Render answers in chat UI
6. Add chat timeline locally
7. Add persistence layer
8. Add guest identity
9. Add auth
10. Add usage limits
11. Add billing

---

## 26. Notes for Future Iterations

Future improvements after V1 may include:

* area selection capture
* keyboard shortcuts
* better screenshot-to-message linking UI
* chat search
* richer plan model
* guest-to-user history migration
* smarter context selection across long chats
* deletion/export/privacy controls
