import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/lib/site-config";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const HTTP_OK = 200;
const HTTP_ACCEPTED = 202;
const batchSize = 10_000;

interface IndexNowResponse {
  message: string;
  statusCode: number;
  success: boolean;
}

async function submitToIndexNow(urls: string[]): Promise<IndexNowResponse> {
  const payload = {
    host: siteConfig.domain,
    key: siteConfig.indexNowKey,
    keyLocation: `${siteConfig.baseUrl}/${siteConfig.indexNowKey}.txt`,
    urlList: urls,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "POST",
    });

    const statusCode = response.status;

    if (statusCode === HTTP_OK || statusCode === HTTP_ACCEPTED) {
      return {
        message: `Successfully submitted ${urls.length} URLs to IndexNow`,
        statusCode,
        success: true,
      };
    }

    const errorText = await response.text();
    return {
      message: `IndexNow API returned ${statusCode}: ${errorText}`,
      statusCode,
      success: false,
    };
  } catch (error) {
    return {
      message: `Error submitting to IndexNow: ${error instanceof Error ? error.message : "Unknown error"}`,
      statusCode: 0,
      success: false,
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
          batches: results.length,
          message: `Successfully submitted ${totalUrls} URLs to IndexNow`,
          results,
          success: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Some submissions failed",
        results,
        success: false,
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
