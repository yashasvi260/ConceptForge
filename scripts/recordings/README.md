# Recording jobs

Each `*.mjs` file here describes prompts to send to a real model through Ollama. Run one with

    OLLAMA_URL=http://<host>:11434 node scripts/record-generations.mjs scripts/recordings/<job>.mjs

From WSL the Windows host's Ollama is at the default-gateway IP (`ip route | awk '/default/ {print $3}'`).
The output JSON (a `RecordingFile`, see `src/llm/recordings.ts`) is committed next to the module that shows it.
Re-running skips keys already recorded; `--force` re-records everything. Outputs are kept exactly as returned.
