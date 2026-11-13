# Reviewer Help

Upload project guidance, QC reports, or evaluation instructions, then ask questions about the documents. Each answer includes the source passages it used.

## Open Reviewer Help in your browser

Open your team’s hosted URL and sign in as `reviewer` with the team passcode. Ask a question in the chat. QAs can enter the upload passcode and add project guides. The app indexes each upload before marking it ready.

## Deploy the shared cloud app

The Vercel build serves the app, indexes uploads into a private Blob store, and generates answers through Vercel AI Gateway. Reviewers open the deployed URL in their browser. Node.js and Ollama are only needed for the separate local version.

1. Import this repository into Vercel and enable project OIDC.
2. Connect a private Vercel Blob store to the project. The connection provides `BLOB_STORE_ID` for OIDC access. A Blob read/write token also works if the project uses token authentication.
3. Set production environment variables `QC_TEAM_PASSCODE` and `QC_ADMIN_TOKEN` to distinct strong passcodes. The first grants access to the shared library and chat. The second grants permission to upload, replace, and remove files.
4. Deploy, then open the URL and sign in with username `reviewer` and the team passcode. Upload a sample file with the QA passcode and ask a question about it immediately.

The hosted upload limit is 4 MB per file. PDF, DOCX, TXT, and Markdown are supported. The hosted library starts empty. It stores extracted passages in private Blob storage, and passages and questions are embedded through AI Gateway, and matching passages are sent with the question to the configured answer model through Vercel AI Gateway. The cloud uses OpenAI text-embedding-3-small for semantic retrieval and Qwen Flash for answers through AI Gateway. The vectors are stored with the passages in the private Blob store. Use `QC_CLOUD_MODEL` to select a different answer model. If migrating a previously hosted library without vectors, reupload those files to index them. Confirm the account, data handling, and model are approved for the material your team uploads.

## Connect one Slack channel

1. Deploy the cloud app and verify its document upload and chat.
2. Create a Slack app named **Reviewer Help** at [Slack Apps](https://api.slack.com/apps). Under **OAuth & Permissions**, add the bot scopes `app_mentions:read` and `chat:write`, then install it in the workspace. If app installs are restricted, have a workspace admin approve it.
3. In Vercel, set `SLACK_BOT_TOKEN` from **OAuth & Permissions** and `SLACK_SIGNING_SECRET` from **Basic Information**. Also set `SLACK_TEAM_ID` and `SLACK_CHANNEL_ID` to the IDs of the workspace and the internal channel that may read the shared library. Redeploy after setting these values.
4. In Slack app settings, turn on **Event Subscriptions**. Set **Request URL** to `https://YOUR-DEPLOYMENT/api/slack/events`. Add `app_mention` under **Subscribe to bot events** and save. Reinstall if Slack asks you to.
5. In that channel, use `/invite @Reviewer Help`, then mention it with a question covered by an uploaded guide. It replies in the thread with document and page or passage citations.

Keep both Slack secrets in Vercel. Every member of the configured channel can see the bot’s replies. Use an internal channel whose members may read the library. Uploads still happen in the web app. Slack messages are only received when the bot is tagged, and messages from external Slack Connect channels are ignored.

## Optional local development

1. Install Node.js 22 or newer and Ollama.
2. Start Ollama and download the local model once:

   ```sh
   ollama pull qwen3.5:2b
   ollama pull nomic-embed-text
   ```

3. Clone or download this repository. From its folder, run:

   ```sh
   node server.mjs
   ```

4. Open [Reviewer Help](http://127.0.0.1:4173). On macOS you can also double click `Start.command` to start it.

Both local models run on your computer. Nomic indexes and searches by meaning. Qwen writes cited answers from the matching passages. If answer generation fails, the app shows matching excerpts. Semantic indexing and search require Ollama.

## Uploads

Text and Markdown work with Node.js alone. For PDFs, install Poppler and make sure `pdftotext` is on your PATH. PDFs need selectable text. For DOCX on Windows and Linux, install Python 3. macOS uses the built-in `textutil`.

Each file can be up to 10 MB. Uploading a file with the same name replaces the previous version. The index is stored in `data/library.json`, which Git ignores. Remove a file from the app to delete its indexed text. Each local copy has its own library. A file is ready only after all its passages have embeddings. Existing local uploads are indexed on the next question.

## Access

The app listens on your own computer. A shared browser link for a team requires a separate deployment with sign-in and persistent storage. For local use, `QC_ADMIN_TOKEN` optionally requires a passcode to change the library.
