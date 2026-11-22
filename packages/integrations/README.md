# @loomcast/integrations

Integrations with social platforms, shared across clients.

This package will contain each platform's API calls, authorization requirements,
token refresh logic, publishing constraints, and upload request handling.
It will use shared models from core as needed and accept client-provided
capabilities for browser authorization, secure storage, and file transfers.

Keep screens and OS-specific implementations outside this package. Never embed
user credentials in its source code. It currently contains only a placeholder.
