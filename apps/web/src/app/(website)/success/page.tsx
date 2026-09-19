import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SuccessPage() {
  return (
    <div className="container mx-auto flex h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-muted">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <CardTitle className="text-2xl">Thanks! You're all set.</CardTitle>
          <CardDescription>You're ready to start designing.</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/rooms">
            <Button className="w-full bg-amber-700 hover:bg-amber-800">
              Start Designing
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
