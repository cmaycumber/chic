/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents_design from "../agents/design.js";
import type * as agents_pinterest from "../agents/pinterest.js";
import type * as agents_tools_addProductsToDesign from "../agents/tools/addProductsToDesign.js";
import type * as agents_tools_createDesign from "../agents/tools/createDesign.js";
import type * as agents_tools_generateDesignImage from "../agents/tools/generateDesignImage.js";
import type * as agents_tools_getDesign from "../agents/tools/getDesign.js";
import type * as agents_tools_index from "../agents/tools/index.js";
import type * as agents_tools_searchProducts from "../agents/tools/searchProducts.js";
import type * as agents_tools_updateDesign from "../agents/tools/updateDesign.js";
import type * as artifacts from "../artifacts.js";
import type * as auth from "../auth.js";
import type * as credits from "../credits.js";
import type * as designs from "../designs.js";
import type * as files from "../files.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as ideas from "../ideas.js";
import type * as lib_amazonAffiliate from "../lib/amazonAffiliate.js";
import type * as lib_amazonSearch from "../lib/amazonSearch.js";
import type * as lib_utils from "../lib/utils.js";
import type * as likes from "../likes.js";
import type * as messages from "../messages.js";
import type * as playground from "../playground.js";
import type * as polar from "../polar.js";
import type * as rooms from "../rooms.js";
import type * as roomsAi from "../roomsAi.js";
import type * as seedDesigns from "../seedDesigns.js";
import type * as streamAbort from "../streamAbort.js";
import type * as threads from "../threads.js";
import type * as tools from "../tools.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/design": typeof agents_design;
  "agents/pinterest": typeof agents_pinterest;
  "agents/tools/addProductsToDesign": typeof agents_tools_addProductsToDesign;
  "agents/tools/createDesign": typeof agents_tools_createDesign;
  "agents/tools/generateDesignImage": typeof agents_tools_generateDesignImage;
  "agents/tools/getDesign": typeof agents_tools_getDesign;
  "agents/tools/index": typeof agents_tools_index;
  "agents/tools/searchProducts": typeof agents_tools_searchProducts;
  "agents/tools/updateDesign": typeof agents_tools_updateDesign;
  artifacts: typeof artifacts;
  auth: typeof auth;
  credits: typeof credits;
  designs: typeof designs;
  files: typeof files;
  healthCheck: typeof healthCheck;
  http: typeof http;
  ideas: typeof ideas;
  "lib/amazonAffiliate": typeof lib_amazonAffiliate;
  "lib/amazonSearch": typeof lib_amazonSearch;
  "lib/utils": typeof lib_utils;
  likes: typeof likes;
  messages: typeof messages;
  playground: typeof playground;
  polar: typeof polar;
  rooms: typeof rooms;
  roomsAi: typeof roomsAi;
  seedDesigns: typeof seedDesigns;
  streamAbort: typeof streamAbort;
  threads: typeof threads;
  tools: typeof tools;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  aggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregate">;
};
