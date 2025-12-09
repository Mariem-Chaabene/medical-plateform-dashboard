import { useState, useCallback } from "react";

export function useToast(autoHideMs = 3500) {
  const [toast, setToast] = useState({
    type: "success",
    title: "",
    message: "",
    visible: false,
  });

  const showToast = useCallback((opts) => {
    setToast({
      type: opts.type || "success",
      title: opts.title || "",
      message: opts.message || "",
      visible: true,
    });

    if (autoHideMs) {
      setTimeout(() => {
        setToast((t) => ({ ...t, visible: false }));
      }, autoHideMs);
    }
  }, [autoHideMs]);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
