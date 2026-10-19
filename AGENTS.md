# Architecture

- Keep startup loading progress in `supabase/functions/_shared/video-loading.ts` and embed its serialized function into the public player script, so React and external players use the same readiness estimate.