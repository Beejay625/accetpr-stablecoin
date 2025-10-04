export function assertRequiredEnvVars(requiredKeys: string[]): void {
  const missing = requiredKeys.filter((key) => {
    const value = process.env[key];
    return value === undefined || String(value).trim() === '';
  });
  if (missing.length > 0) {
    // Keep message concise and actionable
    // Exit non-zero to fail fast at startup
    // eslint-disable-next-line no-console
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

export function validateEnvForStartup(): void {
  const required: string[] = ['CLERK_SECRET_KEY'];
  if (process.env.NODE_ENV === 'production') {
    required.push('JWT_SECRET');
  }
  // Optional: require DB URL if explicitly requested
  if (process.env.REQUIRE_DATABASE === 'true') {
    required.push('DATABASE_URL');
  }
  if (required.length > 0) {
    assertRequiredEnvVars(required);
  }
}


