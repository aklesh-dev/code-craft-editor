# Code Craft

**Clerk**
- Clerk Authentication is used for user authentication.

**Convex**
- Used for the real-time database.

WebHooks
- Webhooks are automated events|(messages) that are sent from apps when something happens.
- Used for integrating with third-party services.

> **Clerk ==> WebHooks ==> Convex**
- Clerk sends a webhook to Convex when a user signs up.
- Convex sends a webhook to Clerk when a new user is created.

For the editor
- used monaco editor for the code editor.
- used library  `@monaco-editor/react` for integrating the editor with react.