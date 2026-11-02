import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getCustomerToken } from "@/shared/lib/auth";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const payload = await getCustomerToken();
  if (payload?.type === "customer") {
    return redirect({ href: "/account", locale: await getLocale() });
  }

  return <RegisterForm />;
}
