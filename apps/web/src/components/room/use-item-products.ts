"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomItem, RoomProduct } from "./types";
import { errorMessage } from "./utils";

type ProductsStatus = "idle" | "loading" | "error";

interface ItemProducts {
  message: string | null;
  products: RoomProduct[];
  retry: () => void;
  status: ProductsStatus;
}

/**
 * Amazon results are cached on the item by the backend, so we only search the
 * first time an item is opened. The ref keeps that to exactly one request per
 * item, even though the reactive query re-renders us while it runs.
 */
export function useItemProducts(
  versionId: Id<"roomVersions">,
  item: RoomItem
): ItemProducts {
  const searchItemProducts = useAction(api.roomsAi.searchItemProducts);
  const [status, setStatus] = useState<ProductsStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [fetched, setFetched] = useState<RoomProduct[] | null>(null);
  const requestedRef = useRef<string | null>(null);

  const cached = item.products ?? null;
  const itemId = item.id;
  const requestKey = `${versionId}:${itemId}`;

  const search = useCallback(() => {
    setStatus("loading");
    setMessage(null);
    searchItemProducts({ itemId, versionId })
      .then((result) => {
        setFetched(result);
        setStatus("idle");
      })
      .catch((error: unknown) => {
        setMessage(errorMessage(error));
        setStatus("error");
      });
  }, [itemId, searchItemProducts, versionId]);

  const retry = useCallback(() => {
    requestedRef.current = requestKey;
    search();
  }, [requestKey, search]);

  useEffect(() => {
    if (requestedRef.current === requestKey) {
      return;
    }
    requestedRef.current = requestKey;
    setFetched(null);
    if (cached && cached.length > 0) {
      return;
    }
    search();
  }, [cached, requestKey, search]);

  return {
    message,
    products: cached ?? fetched ?? [],
    retry,
    status,
  };
}
