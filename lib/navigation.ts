import { router, type Href } from 'expo-router';

export function goBackOrFallback(fallback: Href = '/') {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
