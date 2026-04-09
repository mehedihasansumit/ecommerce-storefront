import { redirect } from "next/navigation";
import { getCustomerToken } from "@/shared/lib/auth";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const payload = await getCustomerToken();
  if (payload?.type === "customer") {
    redirect("/account");
  }

  return <RegisterForm />;
}
