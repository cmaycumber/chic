import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <FileQuestion className="mb-4 size-16 text-muted-foreground" />
      <h1 className="mb-2 font-bold text-3xl">Design Not Found</h1>
      <p className="mb-6 text-center text-muted-foreground">
        This design doesn't exist or is not publicly available.
      </p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
