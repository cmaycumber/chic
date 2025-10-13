"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";

export function useDemoThread(title?: string) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const createThread = useMutation(api.threads.createNewThread);

  const initializeThread = useCallback(async () => {
    const newThreadId = await createThread({ title });
    setThreadId(newThreadId);
  }, [createThread, title]);

  const resetThread = useCallback(async () => {
    const newThreadId = await createThread({ title });
    setThreadId(newThreadId);
  }, [createThread, title]);

  useEffect(() => {
    const init = async () => {
      await initializeThread();
    };
    init().catch((error: unknown) => {
      throw error;
    });
  }, [initializeThread]);

  return { threadId, resetThread };
}
