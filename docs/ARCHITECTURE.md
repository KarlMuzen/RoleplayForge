# Architecture

Three diagrams of how RoleplayForge is built. GitHub draws the Mermaid blocks; any AI can read them as text. Edges in diagrams 1 and 2 come from the `import` lines and function calls in `src/` read at `main` `48c6eae` (2026-10-30), except where a note below says otherwise. They are not a full call trace. If a diagram and the code disagree, the code wins; fix the diagram.

An editable FigJam copy exists on the owner's Figma board. It is a picture only; this file is the source.

## 1. App layers

No backend. Everything runs in the browser; the only network calls are to the model providers and to Chub (card import by URL). Since Task 028 no file under `src/components` imports the `db` object (a lint rule fails the build if one does), so screens read through the store; services, routing and `src/io` may use the database. Not re-checked since: how Chat and Test Lab save their data.

```mermaid
flowchart LR
    subgraph client ["User Device"]
        phone["Phone or desktop browser (installed PWA)"]
    end
    subgraph gateway ["App Shell"]
        router["Hash router (src/routing)"]
    end
    subgraph service ["App Logic (src)"]
        library["Library (GalleryView, paste import)"]
        editor["Forge: Details, Lorebook, Prompt"]
        assist["Assist and Enhancer (AI patches)"]
        chat["Chat preview (ChatPreviewModal)"]
        testlab["Test Lab (CrucibleView)"]
        settings["Settings (profiles, backup, sync, security)"]
        store["Zustand store (card, ui, profile, session, assistant slices)"]
        io["Import and export (png, charx, json, chub, converter)"]
        tools["Free tools (tokenizer, writingLint, lorebookScan, chatMarkup, pasteImport)"]
        engine["Conversation engine (prompt building)"]
        llm["LLM adapter (llmAdapter.ts)"]
    end
    subgraph datastore ["Local Storage"]
        dexie["IndexedDB via Dexie (cards, lorebooks, connectionProfiles, settings)"]
    end
    subgraph external ["External"]
        providers["LLM providers (OpenAI, Anthropic, Gemini, OpenRouter, Ollama, custom)"]
        chub["Chub (card import by URL)"]
    end

    phone -->|"Navigates"| router
    router -->|"Opens Library"| library
    router -->|"Opens Forge"| editor
    router -->|"Opens Assist"| assist
    router -->|"Opens Test"| testlab
    router -->|"Opens Settings"| settings
    editor -->|"Opens Chat"| chat
    library -->|"Imports cards"| io
    library -->|"Reads"| store
    editor -->|"Reads and edits"| store
    editor -->|"Counts and lints"| tools
    assist -->|"Requests edits"| llm
    chat -->|"Builds prompts"| engine
    chat -->|"Saves chats"| dexie
    testlab -->|"Runs scenarios"| engine
    testlab -->|"Scores runs"| tools
    engine -->|"Sends requests"| llm
    engine -->|"Scans lorebook"| tools
    settings -->|"Saves profiles"| store
    store -->|"Reads and writes"| dexie
    io -->|"Saves imports"| dexie
    llm -.->|"Provider APIs: chat requests"| providers
    io -.->|"Chub: fetches card"| chub
```

Notes:
- Free tools live in two places: `src/utils` (older: tokenizer, `writingLint`, `lorebookScan`) and `src/core` (newer: `chatMarkup`, `pasteImport`). Existing files are not moved (`PROJECT_STATE.md` Decision 2).
- `writingLint` is used only by the pre-flight audit modal.

## 2. Data safety

Frozen identifiers (do not rename): DB name `CardCrucibleDB`, settings keys, the `enc.v1.` format, passkey and sync identifiers (`PROJECT_STATE.md` Guardrails).

```mermaid
flowchart LR
    subgraph inputs ["Ways data enters"]
        edit[/"Editing in the app"/]
        imp[/"Import card file or paste"/]
        restore[/"Restore backup file"/]
        syncIn[/"Receive from another device"/]
    end
    subgraph guard ["Checks on the way in"]
        cardImport["importCardData and converter (defaults, warnings)"]
        backupParse["parseBackupPayload (zip or JSON, 200 MB cap)"]
        hooks["Dexie write hooks (Zod storage schema on cards and lorebooks)"]
    end
    dexie[("IndexedDB CardCrucibleDB: cards, lorebooks, connectionProfiles, settings")]
    subgraph secrets ["Secrets (frozen identifiers)"]
        vault["API keys: enc.v1 AES-GCM, key from passphrase (PBKDF2) or passkey"]
        vaultKeys["Settings keys: crypto_mode, passkey_credential_id, passkey_wrapped_key, passkey_prf_salt"]
    end
    subgraph outputs ["Ways data leaves"]
        exp["Export card (PNG, JSON, CHARX)"]
        backupOut["Backup file from Settings (API keys optional since Task 027)"]
        syncOut["Send to other device (WebRTC, no API keys)"]
    end

    edit -->|"Saves card"| hooks
    imp --> cardImport
    cardImport -->|"Saves card"| hooks
    restore --> backupParse
    syncIn -->|"Preview first"| backupParse
    backupParse -.->|"Merge writes (hook use unverified)"| hooks
    hooks --> dexie
    vault -->|"Stored in"| dexie
    vaultKeys -->|"Stored in"| dexie
    dexie --> exp
    dexie --> backupOut
    dexie --> syncOut

    style inputs fill:#C2E5FF,stroke:#3DADFF
    style guard fill:#CDF4D3,stroke:#66D575
    style secrets fill:#FFCDC2,stroke:#FF7556
    style outputs fill:#FFECBD,stroke:#FFC943
```

Open item (unverified): `src/io/backup.ts` has no schema check of its own (no Zod import found). Whether restore and device-sync writes go through the Dexie hooks on cards and lorebooks has not been checked in code. Hooks exist only on the `cards` and `lorebooks` tables; `connectionProfiles` and `settings` have none.

## 3. Delivery pipeline

A picture of `docs/AI_WORKFLOW.md`. That file is final and wins on any difference.

```mermaid
flowchart LR
    owner(["Owner: idea or problem"])
    plan["Claude plans and writes the task card"]
    card[/"Task card in docs/tasks"/]
    exec["Executor (ChatGPT or Muse, owner names one) codes on wip/NNN and opens PR"]
    ci{"CI test-and-lint green?"}
    stop["Executor stops and reports"]
    rev{"Card says Review required?"}
    review["Claude reviews PR diff"]
    merge["Executor squash-merges by hand"]
    deploy["Vercel deploys main (code commits only)"]
    ready{"Production deployment READY?"}
    recover["Manual deploy (Decision 22)"]
    done["Merged (executor deleted the card in the PR)"]
    sync["Claude syncs PROJECT_STATE"]
    check[/"Owner checks production on phone"/]

    owner --> plan
    plan --> card
    card -->|"Execute NNN"| exec
    exec --> ci
    ci -->|"No, fix (2 tries)"| exec
    ci -->|"Red after 2 fixes"| stop
    ci -->|"Yes"| rev
    rev -->|"Yes"| review
    rev -->|"No"| merge
    review -->|"Approved"| merge
    review -->|"Changes needed"| exec
    merge --> deploy
    deploy --> ready
    ready -->|"Yes"| done
    ready -->|"No"| recover
    recover --> done
    done --> sync
    sync --> check
    check -.->|"Problems become new cards"| owner

    style owner fill:#CDF4D3,stroke:#66D575
    style check fill:#CDF4D3,stroke:#66D575
    style plan fill:#DCCCFF,stroke:#874FFF
    style review fill:#DCCCFF,stroke:#874FFF
    style sync fill:#DCCCFF,stroke:#874FFF
    style exec fill:#C2E5FF,stroke:#3DADFF
    style merge fill:#C2E5FF,stroke:#3DADFF
    style stop fill:#FFCDC2,stroke:#FF7556
    style recover fill:#FFECBD,stroke:#FFC943
```
