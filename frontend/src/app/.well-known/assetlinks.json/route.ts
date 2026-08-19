const PACKAGE_NAME = "tr.kiliccoffeeroaster.ops";

export async function GET() {
  const fingerprints = (
    process.env.ANDROID_SHA256_FINGERPRINTS ||
    process.env.NEXT_PUBLIC_ANDROID_SHA256_FINGERPRINTS ||
    ""
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const dynamic = "force-dynamic";
