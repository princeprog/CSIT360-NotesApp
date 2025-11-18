import { useNotes } from "../context/NotesContext";
import { Clock } from "lucide-react";

function History() {
  const { history } = useNotes();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Activity History</h1>

      {history.length === 0 ? (
        <p className="text-gray-500">No history yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded-xl shadow flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{item.action}</p>
                <p className="text-gray-600 text-sm">
                  {item.noteTitle} — {item.category}
                </p>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock size={16} />
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
