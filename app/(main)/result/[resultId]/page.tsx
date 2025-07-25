"use client";

import ResultBoard from "@/components/game/result-borad";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ResultPage() {
  const params = useParams();

  // Get gameId from URL path params
  const resultId = params.resultId as string;

  if (!resultId) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-lg">No result ID provided.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return <ResultBoard resultId={resultId} />;
}
