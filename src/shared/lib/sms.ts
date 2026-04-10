interface SendSmsOptions {
  to: string;
  message: string;
}

export async function sendSms({ to, message }: SendSmsOptions): Promise<boolean> {
  // SMS provider integration placeholder
  // Configure SMS_PROVIDER env var and implement provider-specific logic
  const provider = process.env.SMS_PROVIDER;

  if (!provider) {
    console.warn("[sms] SMS provider not configured, skipping SMS to:", to);
    return false;
  }

  // TODO: Implement provider-specific SMS sending (Twilio, etc.)
  console.log(`[sms] Would send to ${to}: ${message}`);
  return false;
}
