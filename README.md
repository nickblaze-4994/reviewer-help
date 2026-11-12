# Reviewer Help

Upload project guidance, QC reports, or evaluation instructions, then ask questions about the documents. Each answer includes the source passages it used.

## Run on your computer

1. Install Node.js 22 or newer and Ollama.
2. Start Ollama and download the local model once:

   ```sh
   ollama pull qwen3.5:2b
   ```

3. Clone or download this repository. From its folder, run:

   ```sh
   node server.mjs
   ```

4. Open [Reviewer Help](http://127.0.0.1:4173). On macOS you can also double click `Start.command` to start it.

The model runs on your computer. If Ollama is unavailable, the app shows matching excerpts. Set `QC_MODEL` to a different installed Ollama model if needed.

## Uploads

Text and Markdown work with Node.js alone. For PDFs, install Poppler and make sure `pdftotext` is on your PATH. PDFs need selectable text. For DOCX on Windows and Linux, install Python 3. macOS uses the built-in `textutil`.

Each file can be up to 10 MB. Uploading a file with the same name replaces the previous version. The index is stored in `data/library.json`, which Git ignores. Remove a file from the app to delete its indexed text. Each copy has its own library.

## Access

The app listens on your own computer. A shared browser link for a team requires a separate deployment with sign-in and persistent storage. For local use, `QC_ADMIN_TOKEN` optionally requires a passcode to change the library.

## Shared cloud deployment

The Vercel build serves the app, indexes uploads into a private Blob store, and generates answers through Vercel AI Gateway. Reviewers open the deployed URL in their browser. Node.js and Ollama are only needed for the separate local version.

1. Import this repository into Vercel and enable project OIDC.
2. Connect a private Vercel Blob store to the project. The connection provides `BLOB_STORE_ID` for OIDC access. A Blob read/write token also works if the project uses token authentication.
3. Set production environment variables `QC_TEAM_PASSCODE` and `QC_ADMIN_TOKEN` to distinct strong passcodes. The first grants access to the shared library and chat. The second grants permission to upload, replace, and remove files.
4. Deploy, then open the URL and sign in with username `reviewer` and the team passcode. Upload a sample file with the QA passcode and ask a question about it immediately.

The hosted upload limit is 4 MB per file. PDF, DOCX, TXT, and Markdown are supported. The hosted library starts empty. It stores extracted passages in private Blob storage, and matching passages and questions are sent to the configured model through Vercel AI Gateway. Use `QC_CLOUD_MODEL` to override the default Gemini Flash Lite model. Confirm the account, data handling, and model are approved for the material your team uploads.
