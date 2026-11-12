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
