interface GameScoreBoardProps {
  round: number;
  totalRounds: number;
  lives: number;
  score: number;
}

export default function GameScoreBoard({
  round,
  totalRounds,
  lives,
  score,
}: GameScoreBoardProps) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="grid grid-cols-2 gap-4 w-full max-w-xl px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-sm shadow-xl text-white">
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-300">Now Guessing</span>
          <span className="text-2xl font-bold tracking-wide text-yellow-400">
            Top #{round}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-300">Lives</span>
          <span
            className={`text-2xl font-bold tracking-wide ${
              lives <= 1 ? "text-red-500" : "text-green-400"
            }`}
          >
            {lives}
          </span>
        </div>
      </div>
    </div>
  );
}
