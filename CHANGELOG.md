# Changelog

## [0.0.1] — 2026-10-04

First release of **Mimir**, a desktop-first agentic co-learner for university students.

Mimir is built on the provider orchestration, workspace, and packaging that
Synara shipped as MIT-licensed open source. This release resets the product
line to a fresh 0.0.1: it ships the production app only, with the Mimir
identity, update feed, and iconography.

### Added

- Production desktop app for macOS (Apple Silicon and Intel), Windows, and
  Linux, signed with the Mimir identity (`com.itshimelz.mimir`).
- Chat-driven study workspaces backed by local-first projects and threads.
- Provider orchestration across Claude Code, Codex, Cursor, Grok, OpenCode,
  Droid, Devin, Antigravity, and Pi.
- Computer Use and an in-app browser for agent-driven desktop and web work.

### Notes

- There is no Beta channel in this release.
- The in-app "What's new" history predates Mimir and is retained for
  provenance; Mimir-specific release notes start from this entry.

## 1.0.4 — 2026-10-13

**Faster long chats, browser tabs that keep their place, and more dependable session recovery and Computer Use.**

This Stable release audits all **33 commits** from `v1.0.3` through feature head `d36a31a294e59ff882e0d8f319af9dd77f9320c8`. Hubs remains available in Stable. Inline visuals and diagnostics remain Beta-only; this release does not promote them or share data between the two apps.

### Added

- **Paste images and files with Computer Use on macOS.** Native paste and short batches accept a workspace image or file as well as text. Every batch file is validated before input begins. Clipboard preservation keeps native formats inside the driver and reports restoration; a newer human copy is retained. Unsupported preservation refuses before replacing the clipboard. Target consent still applies, and paste dispatch alone does not establish attachment upload or saving.
- **Choose whether working and unread chats float to the top.** The new **Working and unread on top** setting is enabled by default. Turn it off to keep **Recently active** sorting chronological; creation-time ordering remains chronological.

### Changed

- **Long conversations open and switch with less layout work.** Content-aware row heights, bounded text sampling and conservatively reused settled-message measurements reduce re-anchoring when reading history. Startup no longer subscribes to the same conversation twice. Full transcript loading is retained, and scrolling away releases end-follow.
- **Browser tabs stay loaded longer.** Ordinary inactive tabs retain their DOM, forms, scroll and history for up to ten minutes; leaving a chat keeps its browser warm for up to five minutes. Per-chat and app-wide runtime budgets can suspend hidden pages sooner, while visible pages, protected automation actions and OAuth openers remain protected. Suspended pages reload their URL rather than promising permanent preservation of unsaved page state.
- **Unexpected shutdowns can resume eligible ordinary chats.** Startup records actively running human chats before settling orphaned turns, then requests a continuation that checks existing operations before repeating them. Pending approvals/questions, starting or archived chats, native subagents, delegated tasks, goals, Hubs and scheduled work are excluded from this fallback. Explicit quit choices take precedence.
- **Server maintenance does less blocking work.** POSIX process-tree scans run asynchronously, and runtime reconciliation uses a new additive message-activity index with turn-scoped lookups instead of rescanning long conversations.

### Fixed

- **Active provider sessions survive stale idle decisions.** Cleanup acquires lifecycle ownership and rechecks live turns, queued sends, background tasks and recent activity before stopping a session. Pi snapshot reads no longer manufacture new activity timestamps.
- **Stalls and delayed notifications do not retire healthy work.** Codex authentication and session-presence deadlines discount event-loop stalls. Delayed completion, abort and terminal-error notifications retain their original turn and cannot settle a newer one or invalidate its gateway authority. Provider and Claude reconfiguration preparation have bounded waits without abandoning process retirement.
- **Hub permissions remain consistent.** Coordinator check-ins use the chat's current access mode; workers inherit it or fall back from unsupported inherited Auto to **Ask for approval**. Claude Auto evidence is reused only for the same model/account, and Devin recognizes **Ask Everytime** without confusing it with read-only Ask mode.
- **Computer Use can recover from unanswered approvals and stalled listeners.** A foreground card that expires after five minutes can be requested again; explicit decline/cancel remains effective for that turn. A readiness watchdog restarts a silent input listener, while input stays paused until readiness is established.
- **Computer Use reports evidence more accurately.** Native text delivery requires matching insertion evidence and does not infer retry offsets from rich-editor value lengths. Stable state verification and measured scroll travel count as progress; observation-only batches do not trigger mutation repetition guards. Uncertain input is not replayed automatically.
- **Native targeting stays with the intended window.** The macOS driver excludes unowned application document roots, parked web-document trees and its own cursor overlay from the relevant target paths, then rechecks retained semantic targets before input. Missing target evidence remains unknown.
- **Browser pages return after window replacement or suspension.** Reopening a suspended agent-owned tab restores its URL when no tool is acting on it. Replacing the desktop window marks destroyed page runtimes for restoration. Switching tabs reveals the incoming page before hiding the outgoing page to avoid an empty frame.
- **Sidebar rows stay put during interaction.** Working/unread order is held while the pointer is over the list or a press is active. Opening a subagent keeps the relevant rows anchored. The Automations badge counts configured automations, matching the **All** tab, rather than unresolved runs.
- **First-turn naming survives replay backlogs.** Chat titles and worktree names are owned by the first durable user message, including queued sends; later messages and manual title changes are respected.
- **Provider setup and effort choices are accurate.** Pi reports unavailable when neither its CLI nor an SDK credential setup exists, while credentialed SDK-only use remains supported. Grok 4.7 Build Fast exposes **Extra High** effort.
- **Workspace special files cannot strand file workers.** POSIX reads and version-checked saves reject named pipes without a blocking open, keeping unrelated file and runtime requests responsive. This fixes the reproduced FIFO starvation case, not every possible unresponsive-server cause.
- **Transcript and composer details are clearer.** Background task/Monitor completions arriving during active work stay inside that response. File-read tools use the book icon, the context meter's progress ring is restored, and composer outlines/corners are corrected. The empty Hubs page uses its route card, and **Skip setup** has usable spacing and keyboard focus.

### Verification

Release inputs passed frozen dependency installation with Node 24.13.1 and Bun 1.4.2, formatting, lint (910 warnings, zero errors), all seven workspace typechecks, release smoke, Windows runtime-boundary checks and migration lineage. Focused tests passed 1,575 server cases (two skipped), 395 web cases, 287 desktop cases and 18 Chromium cases. No failing local reruns are hidden in these totals. The complete feature-head CI passed on `d36a31a294e59ff882e0d8f319af9dd77f9320c8` (run `38451857388`).

The exact tag workflow remains the final publication gate for the full quality suite, all three server shards, four native packages, provenance, macOS signing/notarization and Intel startup, Windows Defender/startup, and public release assets. Windows uses the version-scoped unsigned policy; unsigned does not bypass qualification.

Prepublication macOS attempts on `775b3359e18bb9429fb59a3dd3e5ef6744e39a57` exposed repeated Apple ticket-delivery connection losses after accepted notarization. The packaging correction retries only `stapler` exit 68 with `NSURLErrorDomain Code=-1005`, at most four attempts with bounded backoff, including provenance validation. Other failures still stop publication. Three regression cases failed on the previous command runner; all 45 focused notarization, DMG, provenance and checkpoint tests passed after the repair. The corrected candidate requires fresh native qualification; earlier installers are not relabeled or reused across source commits.

The scoped correction run exposed two pre-existing test timing defects: AppSnap cleanup assumed six event-loop turns meant disk writes had finished, and a checkpoint liveness assertion imposed a 500 ms Git completion budget. The AppSnap test now observes completed durable-file deletion and restores real timers before teardown; the checkpoint test retains the blocked-workspace assertion with a bounded 10-second wait. All 53 AppSnap and 94 checkpoint tests passed locally. Browser CI also reported transient streaming-follow gaps after thread switching and the bottom arrow. The final growth assertion previously sampled before the delivered text finished its bounded smooth reveal; it now waits for the exact rendered paragraphs and stable layout before applying the unchanged 4 px bottom tolerance. All 32 chat-follow cases passed locally after this test-only correction. No production UI behavior changed. An audit of merged Computer Use PR #1915 found all nine affected test files green in candidate CI (842 tests); the failing AppSnap and chat-follow cases predated that PR and its safety/transport coverage was retained.

Existing Chrome performance measurements predate the final row-height cache repair and are not presented as v1.0.4 speedup percentages. The bounded-estimator microbenchmark measures the helper only. Manual installed-app upgrades, credentialed live-provider sessions and application-specific Computer Use outcomes are not established by source tests or packaged startup checks.

## 1.0.3 — 2026-10-11

**Easier Hub navigation, simpler conversation recovery and safer provider restarts.**

This Stable patch audits all **three commits** from `v1.0.2` through `fc6fd90c1f3854719ef83fcdb3ee7e57a8437986`: PR [#1685](https://github.com/Emanuele-web04/synara/pull/1685), the direct transcript/Hub navigation commit `52f06318f`, and PR [#1846](https://github.com/Emanuele-web04/synara/pull/1846). Hubs remains available in Stable; diagnostics remains Beta-only. Stable and Beta retain separate identities, data homes and update feeds.

### Added

- Hubs is visible in the main rail by default. Existing saved settings reveal it once; hiding it again from Customize remains respected. Coordinator rows use the project sidebar layout with worker disclosure, pinning and a settings action.

### Changed

- Native conversation detail loads the full server projection. The recent-history pager, first-message loader and private IndexedDB detail cache added in 1.0.2 have been removed. Imported provider history retains its separate **Load earlier messages** control. Stored conversations and exports are not truncated by this change.
- Active work shows **Working for** with a live duration; settled work uses a compact **Worked for** disclosure. Labels follow the chat font size, without model badges or completion icons. Finished tools and narration remain expandable, or visible when folding is disabled.
- Native release packaging can overlap quality and server tests, while both publishers still require every mandatory gate. Intel macOS packaging runs on Apple Silicon with architecture checks and an actual Intel-host startup check. Failed attempts can retain a verified same-run artifact checkpoint for qualification retries; source, signing and digest checks fail closed. These workflow changes do not establish a percentage speedup for this release.

### Fixed

- Recovery snapshots apply projected rollbacks/reverts, preventing removed messages from reappearing after a disconnect. Ordinary refreshes still preserve newer streamed text.
- Provider restart recovery does not create replacement sessions or resend persisted child commands whose owner is missing or deleted. Undispatched work is blocked; ambiguous delivery stays uncertain. Surviving children report the error and unrelated chats remain usable.
- Persisted Claude compaction reviews with unavailable owners stay held instead of resending the message or failing startup.
- Chat deletion cancels queued work and clears local caches before optional computer teardown, so a cleanup failure or timeout cannot leave queued promotions stuck.
- Desktop HTTP requests initialize the pinned Undici dispatcher before requests, avoiding Electron 43's macOS `setTypeOfService` socket crash while preserving fetch globals and error behavior.

### Verification

Local formatting, lint (883 warnings, zero errors), all seven typechecks, release smoke and Windows runtime boundary checks passed on the prepared release inputs. Focused server tests passed 499 cases; web unit tests passed 303. The desktop HTTP regression passed under both Node 24 and Electron 43. The full feature-head CI passed at `fc6fd90c1f3854719ef83fcdb3ee7e57a8437986`.

The initial local browser run passed 230 cases and failed three ChatView cases: send-anchor movement, close-button pointer travel, and transcript reveal timing. All three passed an unchanged isolated rerun; the initial run also logged ResizeObserver notifications. The cause is not established, and this is not reported as a full local browser pass. Hub navigation and imported-history files passed in that run.

The exact tag workflow's full quality suite, three server shards, four native installers and public-asset verification remain publication gates. Signed/notarized macOS, Windows Defender/startup and updater-feed evidence will be recorded after publication. Manual installed-app upgrades and live-provider sessions are not claimed.

## 1.0.2 — 2026-10-11

**Hubs comes to Stable, with visible subagents, chat-managed Tasks and faster reopening of long conversations.**

This Stable release audits **280 commits and 82 merged pull requests** from **v1.0.1** through feature head `6ef12ef86bd5c1f502ad798eeba4dd3b56698a88`, including the features first published in 1.0.2-beta.1 and the subsequent reliability fixes. Hubs is promoted through a separate feature PR before release preparation. Stable and Beta keep their own identities, data homes and update feeds; this release does not copy Beta data back to Stable. Diagnostics remain Beta-only.

### Added

#### Hubs comes to Stable

- Bring a coordinator, parallel worker chats, shared instructions and a versioned Library together in one Hub. Link several repositories, or use a Hub for research, writing and planning without a repository.
- New Hubs run three workers at once; choose one to eight in Hub settings. Excess work waits in a persistent queue. Repository workers default to isolated worktrees; general work and non-Git folders use local workspaces.
- Follow queued, running, waiting and finished work, inspect delivered files and restore Library versions. Pause, resume, archive or restart the coordinator with its conversation retained. Library remote pushes report their actual outcome.
- Resolve worker approvals from the coordinator chat, with links to the worker. Approve once, allow the session where supported, decline or cancel the worker turn. Only you can approve; the coordinator has no approval tool. Queued work inherits the coordinator's access mode unless explicitly overridden.

#### Follow subagents without losing the conversation

- Claude and Codex child agents have their own conversations, permanent compact launch cards, a roster in Environment and a right-dock pane.
- Inspect available briefs, current steps, elapsed time and results; open, message, background or stop supported runs. Repeated invocations and nested children retain their own history and launcher relationship. Codex multi-agent v2 children with encrypted briefs show their task name instead.
- Background results remain visible after the parent finishes. Stopped and failed work retain their actual outcome, and Stop stays available on live cards. The roster shows up to 20 native children per turn with an overflow notice.

#### Ask your agent to maintain Tasks

- Supported sessions can create, list and update Tasks to-dos from a chat: notes, priority, due date, project and completion state. Changes reach open windows without a reload.
- Retried creates use a request ID to avoid duplicates. These tools maintain the list; they do not dispatch a to-do to an agent. Synara permissions still apply.

#### Choose the account your integrations use

- Agent gateway and External MCP callers can discover configured provider instances and select an account for new tasks and automation targets.
- Model discovery and validation use that account. Unknown or disabled instances are rejected before creating work; omitting the instance keeps the default-account behavior.

#### Choose a simpler chat header

- Turn **Thread tabs** off in Settings to show only the current conversation title in the desktop chat header. Tabs remain on by default.
- Enabled tabs keep readable widths and an overflow menu; parent titles no longer appear twice.

### Changed

#### A clearer record of each turn

- Turn headers and compact work groups distinguish replies, interrupted turns, background commands and child agents. Tool groups use clearer action summaries and icons, and Claude Monitor wake-ups appear as compact disclosures.
- Assistant text, questions and work retain chronological order. Background rows are compact and unboxed, and worked-for headers omit redundant timestamps. New Codex automatic approval-review start rows no longer clutter the transcript; denied and aborted review warnings remain.
- Live follow survives thread switches and settled layout changes. Scrolling away releases follow, including when reading down from a transcript displaced far from the bottom.

#### Reopen long conversations faster

- Recent messages load first, with **Load earlier messages** for older history and a private local cache for quicker reopening.
- Search, pins, the message rail and links load the history they need. Cached approvals, questions and queued sends wait for authoritative synchronization. Paging does not truncate saved history or exports; unavailable browser storage falls back to normal loading.
- The message rail mounts only the visible range, discovery avoids duplicated retry budgets, and very large code blocks use the existing full-text fallback above 250,000 characters. Find, Copy code and wrapping remain available.
- Eligible streaming text deltas are batched before durable persistence. Control events and ownership changes flush first, and failure propagation and cancellation remain intact. This is not a claim of universal app or model-generation speedup.

#### Stop also pauses your queued follow-ups

- Queued messages stay put after Stop, errors and usage limits. **Resume** continues them when ready, and the pause survives reload.
- Manual plan sends and Steer preserve queued items until dispatch succeeds. An older rate-limit event does not pause an unrelated turn. Draft edits, attachments and accepted sends remain recoverable during new-thread navigation and synchronization.

#### Branch and review on your terms

- Provider session forks respect the selected message. Each chat remembers its own stacked or split diff layout, with a searchable **Diff layout** default in Settings.
- Checkpoint initialization survives restart. Undo refuses to overwrite files while another chat edits the same physical workspace; separate worktrees remain independent.
- Detached repositories display **Detached HEAD**. Automatic branch publication releases the local mutation lock before waiting for the remote, and internal checkpoint patches bypass text converters.

#### Claude resumes without an unexpected review

- Long-idle resume review is off by default, matching the embedded Claude Code behavior. Enable **Ask before resuming a long idle session** under Providers to choose a summary or full-session resume for large idle contexts.
- Agent and automation sends are not held for this personal review; compaction or a model switch alone does not trigger it. **Don't ask me again** sends as-is and disables the setting.
- The Claude Agent SDK is updated, with clearer account-verification and cloud-credential failures.

### Fixed

#### More dependable provider sessions

- OpenCode v2 reconnects retain stable text/reasoning identity instead of duplicating the reply; completed readable reasoning remains in the work log. Installation-only status explains that OpenCode manages authentication.
- Pi has a bounded 20-second first health probe, retains usable status across transient timeouts and normalizes custom tool titles. Stale provider-health snapshots cannot replace newer results.
- Claude reports whether requested Fast mode is serving, unavailable or cooling down. Oh My Pi preserves explicit real-model choices and hides synthetic roles. Droid custom answers use its expected protocol, and Cursor prompt usage reaches Profile totals.
- Antigravity reports quota and OAuth failures accurately, chooses effort from discovered capabilities, bounds retained diagnostics and awaits helper teardown. An exact benign post-response timeout settles only an already-complete response with no pending work.
- Nested Codex instances rebuild their own gateway endpoint while preserving user TOML and verified source-account identity. Windows command resolution prefers spawn-safe candidates, avoids implicit launch-directory lookup for bare commands and resolves explicitly relative commands from their launch directory. Nushell login environment capture uses native syntax.

#### Reliable reconnects, stops and recovery

- Socket recovery restores subscriptions without automatically replaying requests. Uncertain delivery stays uncertain; recovery budgets and the circuit breaker prevent endless retry loops.
- Provider reconciliation distinguishes abandoned starts from live connecting adapters and advancing assistant messages. Retired generations can settle only the bindings they still own.
- Snapshot/replay ordering retains settled messages, turn ownership, buffered text and late image results. Restarted or stopped turns finalize their remaining streaming messages, and stale requests no longer lock the composer.
- Reconciled quarantine banners clear without overwriting unrelated errors or live state. Completed External MCP tasks release capacity after idle-session updates and restart.
- Usage totals retain native-session attribution and Claude child usage not already covered by a valid parent result. Beta imports keep installation-local environment identity and device ownership.

#### Everyday workspace polish

- Composer panels share the input outline and keep the transcript readable on glass. Light terminals have stronger text contrast, linked right-to-left text keeps its direction and wide voice waveforms fill the track.
- The context meter is a steadier gauge; Create project works in the browser. Activity rows prioritize project folder names over branches and reveal the selected chat without taking composer focus or overriding subsequent reader scrolling.
- Open or working chats stay out of Drafts, and Home restore targets exclude Hub workers. Hidden browser panels release stale bounds so native pages do not reappear over the chat.
- Changing an idle chat's access mode saves the choice without starting its provider or expanding finished work. Saved access mode survives provider-capability loading; the permission menu closes after selection.
- Shared TypeScript preparation is serialized to avoid concurrent compiler patch writes. The keyboard shortcut reference matches current commands and platform/focus conditions.
- The configurable per-pairing External MCP task-capacity proposal was reverted; it is not included in this release.

### Verification

- Publication is gated on full workspace tests, all three server shards and qualified native packaging for the exact tagged release candidate. Local and PR checks below do not substitute for those gates.
- Hubs promotion: Node 24.13.1 / Bun 1.4.2; format, lint and all seven workspace typechecks passed. 214 server tests passed with Stable desktop identity, plus 89 web tests, 14 policy tests, 31 Chromium cases and 59 documentation tests. Marketing production build passed.
- The first promotion CI exposed two outdated Beta-only test expectations: the Stable tour final slide and the disabled-Hubs automation error. The correction retains persistence, recovery and permission assertions; all 133 automation tests and all 10 tour Chromium tests passed locally. The corrected PR passed the complete application CI and strict marketing suite on `9856eb77e93086859e346fbc5dba14fccb0e901e` (runs `38164469869` and `38164469919`).
- Release inputs: format, lint (887 existing warnings, zero errors), seven workspace typechecks, release smoke, Windows runtime boundary, migration lineage and six What's New tests passed locally.
- Local checks and component fixtures do not establish credentialed live-provider operation, signed/notarized installers, manual installation, installed-app upgrades or Windows browser-download behavior.

## 1.0.2-beta.1 — 2026-10-11
