import { redirect } from "next/navigation";

/** The quiz now runs inline in the homepage section — keep old links working. */
export default function QuizPage() {
  redirect("/#quiz");
}
