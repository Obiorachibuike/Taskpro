# TaskPro Mobile

TaskPro is an offline-first React Native task manager built with Expo Router, strict TypeScript, Redux Toolkit, Expo SQLite, Reanimated, Gesture Handler, and Expo Notifications. Tasks, projects, categories, subtasks, tags, reminders, and tombstones are persisted locally before any network operation.

## Quick start

Requirements: Node.js 20+, npm, Android Studio/JDK 17 for native Android development. Expo Go does **not** include this app's native SQLite/background-task configuration; use a development build.

```bash
npm install
cp .env.example .env          # only needed for the optional server
npx expo start                # Metro
npm run android               # build/launch an Android development client
```

The app starts in local mode and is fully usable without an account or server. Complete onboarding, then use the floating + button. Swipe right to complete/restore, left for duplicate/archive/delete, and long-press a card to expand it. In **Tasks → filters → Manual order**, long-press and drag to reorder.

## Application map

- Five tabs: dashboard, tasks, calendar, projects, settings.
- Task create/edit/details, today/upcoming/completed lists, offline search and compound filters.
- Projects and custom categories, monthly/weekly/daily calendar views, quick creation for a selected date.
- Local/authenticated profiles, notification center, theme/haptic settings, and synchronization diagnostics.
- Light, dark, and system themes. Interactive controls have accessibility labels and minimum touch targets.

## SQLite and offline behavior

`src/database/sqlite.ts` opens `taskpro.db`, enables foreign keys and WAL, and applies numbered migrations exactly once. The initial schema contains users, tasks, subtasks, projects, categories, tags, task_tags, reminders, sync_queue, and sync_metadata. Migration 2 adds indexes for active tasks, due dates, project/category lookup, update cursors, reminders, and ready queue entries.

Repositories own all SQL. Inputs are validated with Zod; SQL values are parameterized. Creates/updates/deletes run in transactions. Task hydration batches tags and subtasks rather than issuing per-row queries. Deletes are soft tombstones. Redux holds the active in-memory projection for responsive selectors; only UI preferences are Redux Persist storage. The SQLite file, not Redux, survives restarts as the source of truth.

The Jest suite executes repository tests against real in-memory SQLite through Node's built-in `node:sqlite`; this adapter is test-only and is not shipped to the device.

## Synchronization

Local changes set `sync_status=pending`, increment a record version, and upsert a queue operation. Queue uniqueness by entity/id prevents duplicate pending operations. On reconnect or manual sync, the engine:

1. Pushes ready operations and records successful versions.
2. Applies bounded exponential backoff after failures (1s, 2s, 4s … capped at 15m).
3. Pulls remote changes with a persisted cursor, including tombstones.
4. Uses version + timestamp rules. A clean older local record accepts newer remote data; a stale remote record is rejected. **Divergent dirty local changes are marked `conflict` and retained for review, never silently overwritten.**
5. Persists the last-sync timestamp and pending/error metadata.

Background execution uses Expo Background Task with a 15-minute minimum request; the OS chooses the actual schedule. JavaScript timers are not used as a terminated-app scheduling mechanism. No backend is required for local mode, and SQLite alone is never described as cross-device sync.

### Optional PostgreSQL backend

The included Express/PostgreSQL API provides bcrypt password hashes, 30-day JWT sessions, authenticated per-user data isolation, idempotent push operations, transactional writes, version rejection, and cursor pulls.

```bash
createdb taskpro
cp .env.example .env
# Set a unique JWT_SECRET (32+ characters) and DATABASE_URL
npm run server:dev
npm run server:typecheck
```

`server/schema.sql` is applied at server startup. Set `expo.extra.apiUrl` in `app.json`; use `http://10.0.2.2:4000` for the Android emulator or your machine's LAN HTTPS URL for a physical device. Use HTTPS in production. JWT secrets and database credentials belong only in server environment variables. Sign out/in to create an authenticated session, then open **Settings → Synchronization**.

The password-reset endpoint is enumeration-safe but requires a deployment email-delivery integration; it does not falsely claim to send mail. See `server/README.md`.

## Notifications

On task save, a future due date/time is scheduled with Expo Notifications. Editing reschedules; completion/deletion cancels native schedules and local reminder records. Android uses the high-importance `reminders` channel. Enable permissions in **Settings → Notifications** or from the reminder flow. Tapping a reminder opens task details.

Push token registration is available in `notificationService.ts`. Remote push requires an EAS project ID, Expo push credentials, and a backend that stores tokens/sends messages. Local scheduled reminders work without a push server. Exact alarms can require user approval on newer Android versions; use inexact scheduling if your distribution policy does not permit `SCHEDULE_EXACT_ALARM`.

## Validation and tests

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
```

Coverage is generated in `coverage/` (`lcov.info`, HTML, and JSON summary). The report includes domain validation/date utilities, selectors/statistics, conflict/retry/engine logic, migrations, and real SQLite repositories. Review uncovered lines rather than treating a target percentage as proof of correctness. React Native Testing Library covers common component behavior.

### Detox E2E

Create an Android emulator named `TaskPro_API_35`, start it, then:

```bash
npm run prebuild:android
npx detox build -c android.emu.debug
npm run test:e2e
```

Scenarios cover create/edit/restart persistence, swipe completion, projects, reminders, blocked-backend offline edits, and reconnection/sync UI. Native simulator/emulator access is required; Jest does not emulate Detox results.

## Android APK/AAB

Local debug APK:

```bash
npm run prebuild:android
cd android && ./gradlew assembleDebug
# android/app/build/outputs/apk/debug/app-debug.apk
```

EAS Build (requires Expo account and `eas-cli`):

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build -p android --profile preview     # APK
npx eas-cli@latest build -p android --profile production  # AAB
```

`eas.json` defines development/preview APK and production AAB profiles. Generated `android/` and `ios/` directories are ignored because native projects are reproducibly generated by Expo prebuild.

## Architecture

- `src/app`: Expo Router routes and navigation.
- `src/components`: accessible controls, cards, editor sheets, gestures.
- `src/database`: adapter, migrations, repositories.
- `src/store`: RTK slices, thunks, memoized selectors.
- `src/services`: connectivity, notifications, background work, sync engine/API.
- `src/features/authentication`: secure local/remote sessions.
- `server`: separately deployed authenticated sync service.
- `src/tests`, `e2e`: unit/integration and Detox suites.

Performance measures include indexed queries, batched hydration, memoized derived stats, FlatList windowing/batching, UI-thread Reanimated gestures, a single-flight sync engine, and bounded queue processing.
