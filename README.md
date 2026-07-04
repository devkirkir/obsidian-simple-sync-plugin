# Simple Sync Notes

A plugin for [Obsidian](https://obsidian.md) that synchronizes your vault notes with a [CouchDB](https://couchdb.apache.org/) database.

> ⚠️ **Status: in development.** Core note synchronization (create, modify, rename, delete) is implemented, but the plugin is not yet feature-complete or fully stable. Use with caution and keep backups of your vault.

## Motivation

This project was built out of personal interest — as a way to explore how sync could work with a self-hosted CouchDB backend, and to learn more about the Obsidian plugin API. It's not intended to compete with existing sync solutions.

## Features

- Syncs notes between your vault and a CouchDB instance
- Tracks file creation, edits, renames, and deletions
- Stores CouchDB credentials securely via Obsidian's built-in secret storage

## Requirements

- A running CouchDB instance accessible over HTTP(S)
- Obsidian `1.12.0` or later

## Installation

This plugin is not yet available in the Obsidian Community Plugins directory.

### Manual installation

1. Download `main.js`, `manifest.json` from the [latest release](https://github.com/devkirkir/obsidian-simple-sync-plugin/releases/tag/1.3.1).
2. Copy them into `<your-vault>/.obsidian/plugins/obsidian-simple-sync-plugin/`.
3. Reload Obsidian and enable **Simple Sync Notes** in **Settings → Community plugins**.

### Building from source

```bash
npm install
npm run build
```

The compiled plugin (`main.js`) will be generated in the project root alongside `manifest.json`.

## Setup

1. Open **Settings → Simple Sync Notes**.
2. Enter your **CouchDB URL** in the format `http[s]://[host]:[port]/[dbname]`.
3. Create a secret containing your CouchDB credentials in the format `username:password` and select it in the **Credentials** field.
4. Once both fields are filled in, the plugin will start syncing automatically.

## How it works

Plugin listens to vault events (`create`, `modify`, `rename`, `delete`) and pushes them to CouchDB, keeping a local record of file state (path, revision, and update timestamp) between sessions.

## License

[0BSD](LICENSE)
