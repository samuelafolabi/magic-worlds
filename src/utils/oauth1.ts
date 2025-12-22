import crypto from "crypto";

/**
 * Percent-encodes a string according to OAuth 1.0a specification
 * OAuth uses a stricter encoding than standard URL encoding
 */
export function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

/**
 * Generates a random nonce for OAuth requests
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Gets the current Unix timestamp
 */
export function getTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Generates OAuth 1.0a signature
 */
export function generateOAuthSignature(
  method: string,
  url: string,
  parameters: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  // Percent-encode all parameter names and values
  const encodedParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(parameters)) {
    encodedParams[percentEncode(key)] = percentEncode(value);
  }

  // Sort parameters alphabetically by encoded key
  const sortedKeys = Object.keys(encodedParams).sort();

  // Create parameter string: key1=value1&key2=value2
  const parameterString = sortedKeys
    .map((key) => `${key}=${encodedParams[key]}`)
    .join("&");

  // Create signature base string: METHOD&URL&PARAMETERS
  const signatureBaseString = `${method.toUpperCase()}&${percentEncode(
    url
  )}&${percentEncode(parameterString)}`;

  // Create signing key: CONSUMER_SECRET&TOKEN_SECRET
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(
    tokenSecret
  )}`;

  // Generate HMAC-SHA1 signature
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");

  return signature;
}

/**
 * Creates OAuth 1.0a Authorization header
 */
export function createAuthorizationHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
  additionalParams?: Record<string, string>
): string {
  // Parse URL to extract base URL and query parameters
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

  // Extract query parameters from URL
  const queryParams: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  // Generate OAuth parameters
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: getTimestamp(),
    oauth_nonce: generateNonce(),
    oauth_version: "1.0",
    ...additionalParams,
  };

  // Merge OAuth parameters with query parameters for signature calculation
  const allParams = { ...queryParams, ...oauthParams };

  // Generate signature using base URL (without query params) and all parameters
  const signature = generateOAuthSignature(
    method,
    baseUrl,
    allParams,
    consumerSecret,
    accessTokenSecret
  );

  // Add signature to OAuth parameters (not query params)
  oauthParams.oauth_signature = signature;

  // Create Authorization header string
  // Note: Parameter names are NOT percent-encoded in the header, only values are
  const authParams = Object.keys(oauthParams)
    .sort()
    .map((key) => `${key}="${percentEncode(oauthParams[key])}"`)
    .join(", ");

  return `OAuth ${authParams}`;
}


