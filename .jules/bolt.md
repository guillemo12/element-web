## 2024-05-24 - Missing lazy loading on inline images
**Learning:** Found multiple instances where `<img>` tags are used without `loading="lazy"` in a performance critical path (message list/timeline rendering). Adding `loading="lazy"` will defer loading off-screen images, saving bandwidth and improving initial render performance in long chat histories.
**Action:** Add `loading="lazy"` to images in `MImageReplyBody.tsx`, `MStickerBody.tsx`, etc.
