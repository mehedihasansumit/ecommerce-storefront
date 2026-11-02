import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getCustomerToken } from "@/shared/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const payload = await getCustomerToken();
  if (payload?.type === "customer") {
    return redirect({ href: "/account", locale: await getLocale() });
  }

  return <LoginForm />;
}
