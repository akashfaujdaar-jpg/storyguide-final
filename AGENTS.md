<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared navigation and footer in the root layout so every content route has a consistent reading experience.
- Keep catalogue content in a browser-safe data module and use Ebooks URL search filters for small collections to avoid thin category landing pages.
- Use route-specific metadata helpers and book breadcrumbs; keep illustrative books out of search indexing until a real catalogue is supplied.
- Serve cropped, responsive WebP book covers with stable 2:3 dimensions to minimize bandwidth and layout shifts.
- Keep public journal reads separate from authenticated publishing functions; role checks and database policies protect all draft and write access.
- Assign publishing access only after the designated owner email is verified by auth lifecycle handling; user-editable metadata never grants access.
- Use the public publishing sign-in page with Google and wait for a validated session before loading editor actions; public blog loaders never call protected functions.
- Store blog bodies as plain text with paragraph and heading rendering, avoiding HTML injection and heavy editor dependencies.
