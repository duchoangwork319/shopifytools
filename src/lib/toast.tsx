import { toast } from "sonner";
import { ErrorAlert } from "@/components/custom/error-alert";

export function showError(title: string, description: string, options?: { position?: "top-center" | "bottom-right"; duration?: number }) {
  toast.custom(() => <ErrorAlert title={title} description={description} />, {
    position: options?.position ?? "top-center",
    duration: options?.duration ?? 1500,
  });
}
