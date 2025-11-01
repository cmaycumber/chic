import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/lib/site-config";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const HTTP_OK = 200;
const HTTP_ACCEPTED = 202;
const batchSize = 10_000;

type IndexNowResponse = {
  success: boolean;
  statusCode: number;
  message: string;
};

async function submitToIndexNow(urls: string[]): Promise<IndexNowResponse> {
  const payload = {
    host: siteConfig.domain,
    key: siteConfig.indexNowKey,
    keyLocation: `${siteConfig.baseUrl}/${siteConfig.indexNowKey}.txt`,
    urlList: urls,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const statusCode = response.status;

    if (statusCode === HTTP_OK || statusCode === HTTP_ACCEPTED) {
      return {
        success: true,
        statusCode,
        message: `Successfully submitted ${urls.length} URLs to IndexNow`,
      };
    }

    const errorText = await response.text();
    return {
      success: false,
      statusCode,
      message: `IndexNow API returned ${statusCode}: ${errorText}`,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      message: `Error submitting to IndexNow: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

async function verifySignature(request: Request): Promise<boolean> {
  const webhookSecret = process.env.INDEXNOW_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return false;
  }

  const signature = request.headers.get("x-vercel-signature");

  if (!signature) {
    return false;
  }

  const payload = await request.text();
  const expectedSignature = createHmac("sha1", webhookSecret)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

export async function POST(request: Request) {
  try {
    // Verify HMAC signature
    if (!process.env.INDEXNOW_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Webhook not configured - INDEXNOW_WEBHOOK_SECRET missing" },
        { status: 500 }
      );
    }

    const isValid = await verifySignature(request.clone());

    if (!isValid) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid signature" },
        { status: 401 }
      );
    }

    // Get all URLs from the sitemap
    const sitemapEntries = sitemap();
    const urls = sitemapEntries.map((entry) => entry.url);

    // Batch URLs (IndexNow has a limit of 10,000 URLs per request)
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    // Submit all batches
    const results = await Promise.all(
      batches.map((batch) => submitToIndexNow(batch))
    );

    const allSuccessful = results.every((r) => r.success);
    const totalUrls = results.reduce(
      (sum, r) => (r.success ? sum + urls.length : sum),
      0
    );

    if (allSuccessful) {
      return NextResponse.json(
        {
          success: true,
          message: `Successfully submitted ${totalUrls} URLs to IndexNow`,
          batches: results.length,
          results,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Some submissions failed",
        results,
      },
      { status: 207 } // Multi-Status
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to submit URLs to IndexNow",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
