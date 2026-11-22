# @loomcast/core

Shared application logic for the mobile and future desktop clients.

This package will define account and publishing models, coordinate publishing
workflows, and declare interfaces for storage, authorization, and file uploads.
Each client will provide implementations of those interfaces for its OS.

Keep screens, platform-specific API details, Expo, Electron, and native storage
implementations outside this package. It currently contains only a placeholder.
