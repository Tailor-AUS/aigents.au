# Aigents

A Node.js application for engineering student profiles, university collectives and employer project enquiries. Students create an account, edit their profile, choose whether to share it and receive enquiries. Employers can submit a general request or contact a particular student through a shared profile.

Each university has its own contained community: a campus feed, the projects assigned to that university, and a shared delivery workspace for the students who commit to a project. Communities and project teams never span universities.

## Routes and behaviour

| Route | Purpose |
| --- | --- |
| `/` | Public homepage and illustrative engineering role examples. |
| `/build` | Create a student account and private profile. Successful signup displays a recovery code. |
| `/signin` | Student email/password sign-in. |
| `/profile` | Authenticated profile editing, sharing settings and the student's enquiry inbox. |
| `/recover` | Reset a password using the account email and saved recovery code. |
| `/students/{uuid}` | Shared student profile; returns 404 while sharing is off. |
| `/employers` | General employer project enquiry, saved in the Aigents team inbox. |
| `/employers?student={uuid}` | Enquiry for a currently shared profile, saved for that student and the Aigents team. |
| `/community` | The signed-in student's university community: campus feed, campus projects and members. Prompts to join when they have not joined yet. |
| `/projects/{id}` | A campus project brief. Its task workspace and team notes are visible only to students who have committed FTE to that project. |
| `/team` | Operator sign-in and the authenticated inbox of all employer enquiries. |
| `/team/projects` | Operator workspace: prepare briefs, assign a university, open recruitment and review submitted outputs. |
| `/privacy` | Explanation of profile, account and enquiry data use. |
| `/healthz` | Readiness check; verifies access to the configured data store. |

Profiles are **private by default**. Sharing is an explicit setting saved with the profile. Public views exclude the student's email, grades and transcript filename. Turning sharing off makes the public page and public API unavailable. Academic transcript handling stores a filename reference only; it does not upload or verify the document.

The account email currently cannot be changed. There are no automatic confirmation, enquiry-notification or password-reset emails. Students and operators must sign in to check their inboxes; contact details enable manual follow-up. An enquiry is a saved request, not a booking, a guaranteed placement or a payment agreement.

The existing `/p/{slug}` and `/portal/{slug}` company examples use the legacy seed data in `data/`. They remain separate from registered student accounts and do not represent a live directory of applicants or confirmed employer partnerships.

## University collectives

A student joins exactly one campus community, chosen from the university on their profile. **Campus membership is self-declared.** Aigents matches the university name the student entered against the supported list; it does not verify enrolment against university records, and no verification mechanism exists yet. A student's university is fixed once they join, so a correction requires the Aigents team.

Community posts, comments, reactions, project briefs, task submissions and team notes are readable only inside the university that owns them. A student from another university receives the same "not found" response as a student who guessed a project ID.

Every project carries a target workload in FTE, and **each student may hold at most 0.30 FTE in total across all of their active projects**. FTE is planning capacity only. It is not hours worked, an employment contract, a payment agreement or an entitlement to any share of a project fee; a listed budget is the client project fee. Capacity is enforced by a single conditional write over the whole campus record, so simultaneous commitments cannot oversubscribe either a project's target or a student's personal cap.

Projects move `preparing` → `recruiting` → `active` → `completed` or `cancelled`. The brief and agreed outputs can only be changed while a project is preparing and unstaffed; after that the scope is locked and only the status changes. Closed projects cannot reopen, and closing one releases its students' capacity. Students claim tasks, submit an output link or handover note, and may replace a submission until it is signed off. Operators approve or request changes; **an approval names the exact submission the reviewer opened**, so a submission replaced in the meantime is refused rather than signed off unseen.

The Anax founding project exists on the public homepage only as an A$7,500 `Preparing` teaser with no university assigned. An operator assigns its university from `/team/projects`, which creates it as a single preparing project. Its private preparation checklist is operator-only and never reaches the student views or API.

## Local development

Use Node.js 22, matching the Docker image. From the repository directory:

```powershell
npm ci
npm test

$env:NODE_ENV = 'development'
$env:STORAGE_DRIVER = 'file'
$env:DATA_DIR = '.local-data'
$env:TEAM_ACCESS_KEY = 'local-development-only-synthetic-team-key-2026'
$env:PORT = '3000'
npm start
```

Open `http://localhost:3000`. The example team key is synthetic and must only be used with local test data. `npm run dev` starts the server with Node's file watcher.

The file store persists records under `DATA_DIR`; use a disposable directory for synthetic tests. `.local-data` and `.test-data` are excluded from Git and the Docker build context. Keep other data directories outside the repository/build context. The test suite uses synthetic accounts and checks HTTP journeys, persistence across server restarts, privacy boundaries, concurrent updates and storage-failure handling. These checks do not constitute a production backup-restore test.

## Accounts and recovery

Passwords are salted and hashed with scrypt. Sessions use random tokens in HttpOnly, SameSite=Strict cookies; production cookies are Secure. Stored session records contain token hashes rather than the raw cookie token. Student sessions expire after 30 days and operator sessions after eight hours. Signing out invalidates that session.

The recovery code is a secret shown at signup and after a successful password reset. Save it in a password manager. Recovery requires both the account email and this code, issues a replacement code and invalidates prior student sessions. Only the code hash is stored, so the original code cannot be retrieved later. There is currently no automated email-based fallback if both the password and recovery code are lost. Do not place passwords, recovery codes, session cookies or operator keys in URLs, tickets or logs.

Profile updates use version checks and storage ETags. A stale edit returns a conflict instead of silently overwriting another edit. Keep any unsaved work before reloading after a conflict.

## Production storage and configuration

Production runs on Azure Container Apps and uses a private Azure Blob Storage container. Required configuration:

| Environment variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `STORAGE_DRIVER` | `azure` |
| `AZURE_STORAGE_ACCOUNT_URL` | Storage account endpoint, such as `https://<account>.blob.core.windows.net`. No account key or SAS token. |
| `AZURE_STORAGE_CONTAINER` | The private application-data container. |
| `TEAM_ACCESS_KEY` | Secret reference to the Container App secret `aigents-team-access`. |
| `PORT` | `3000`, matching the ingress target port. |

The Azure SDK uses `DefaultAzureCredential`; in Container Apps, configure the app's managed identity and grant it **Storage Blob Data Contributor** on the intended data container. Create the container before deployment and keep anonymous blob access disabled. Account, profile-index, session and enquiry records share this durable store across replicas and revisions.

Configure blob versioning plus **30-day blob and container soft delete** on the storage account. These protections help with accidental deletion or overwrites; they are not a claim that a restore has been rehearsed. Restoring an account may also restore older password, recovery and sharing state, so evaluate those effects before any recovery operation.

Production fails closed: it will not fall back to local files if Azure storage is missing or unavailable. Startup and `/healthz` check storage accessibility. A storage outage should be treated as an application availability issue, not fixed by switching to the file driver.

## Operator access

Open `/team` and enter the operator key. The key must be at least 32 characters and is supplied through `TEAM_ACCESS_KEY`; it is not hardcoded in the application. General requests appear in this inbox. Requests targeting a student also appear in that student's `/profile` inbox.

An authorised Azure operator can retrieve the key in **Azure portal → Container App → Secrets → `aigents-team-access` → Show value**. Alternatively, run the following in a private terminal with the intended Azure subscription selected:

```powershell
$appName = '<container-app-name>'
$resourceGroup = '<resource-group-name>'
az containerapp secret list --name $appName --resource-group $resourceGroup --show-values --query "[?name=='aigents-team-access'].value | [0]" --output tsv
```

That command displays the secret. Do not share its output or copy it into this README. After changing the secret, restart or deploy the intended revision so it reads the new value. Existing team sessions are rejected once requests reach instances using the new key. Use **Sign out** when finished on a shared device.

## Preview, deployment and rollback

Use a **separate private preview data container** and keep operator keys secret. Keep preview traffic at zero and use a revision-specific preview URL for checks. Preview accounts and enquiries must be synthetic. Deploy the tested image in a separate revision configured with the production data container before promoting it. Never point an unreviewed preview at the production data container.

Before production traffic moves, verify `/healthz`, signup, edit/reload, sharing on/off, targeted and general enquiries, both inboxes, sign-out and recovery against the preview configuration. Verify data survives a revision or replica restart. A healthy homepage alone does not establish that accounts can be saved.

Rollback must preserve the durable Azure storage variables, managed identity access and operator secret reference, and the rollback image must understand the current record and authentication format. **After real accounts exist, do not roll traffic back to a legacy revision that saves signup data to ephemeral container files.** Use a compatible durable-storage revision or repair the current revision. Moving traffic does not restore data, and reverting storage records is a separate operation.

For account or enquiry data requests, contact `deploy@aigents.au` with the account email or enquiry reference, never credentials.
