"use client";

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
}

interface TracksTableProps {
  topTracks: Track[];
  recommendations: Record<string, Track[]> | null;
}

export function TracksTable({ topTracks, recommendations }: TracksTableProps) {
  return (
    <div className="overflow-auto max-h-[70vh]">
      <table className="table-auto border-collapse border border-gray-300 w-full text-left bg-black/30 rounded-lg">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Top Track</th>
            <th className="border border-gray-300 px-4 py-2">
              Recommended Tracks
            </th>
          </tr>
        </thead>
        <tbody>
          {topTracks.map((track) => (
            <tr key={track.id} className="align-top border border-gray-300">
              <td className="border border-gray-300 px-4 py-2">
                <div className="font-semibold">{track.name}</div>
                <div className="text-sm text-gray-400">
                  {track.artists.map((a) => a.name).join(", ")}
                </div>
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {recommendations && recommendations[track.id]?.length ? (
                  <ul className="list-disc list-inside space-y-1">
                    {recommendations[track.id].map((rec) => (
                      <li key={rec.id}>
                        <span className="font-medium">{rec.name}</span> —{" "}
                        {rec.artists.map((a) => a.name).join(", ")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No recommendations</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
