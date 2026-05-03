export function encodeMongoUri(uri: string): string {
  const match = uri.match(/^mongodb:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) return uri;

  const [, username, password, rest] = match;
  const encodedPassword = encodeURIComponent(password);

  return `mongodb://${username}:${encodedPassword}@${rest}`;
}
