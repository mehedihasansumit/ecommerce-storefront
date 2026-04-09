import { redirect } from "next/navigation";
import { getCustomerToken } from "@/shared/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const payload = await getCustomerToken();
  if (payload?.type === "customer") {
    redirect("/account");
  }

  return <LoginForm />;
}
