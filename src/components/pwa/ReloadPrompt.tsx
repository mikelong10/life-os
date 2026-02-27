import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, UPDATE_CHECK_INTERVAL_MS);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-4 z-50 md:right-4 md:bottom-4 md:left-auto md:w-80">
      <div className="bg-card rounded-lg border p-4 shadow-lg">
        <p className="text-foreground text-sm">
          {offlineReady ? "App ready to work offline." : "A new version is available."}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Update now
            </button>
          )}
          <button
            onClick={close}
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
