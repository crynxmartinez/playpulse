import { Gamepad2, Plus } from 'lucide-react'

export default function GamesPage() {
  const games = [
    { id: 1, name: 'Adventure Quest', players: 234, status: 'Active' },
    { id: 2, name: 'Space Shooter', players: 567, status: 'Active' },
    { id: 3, name: 'Puzzle Master', players: 123, status: 'Maintenance' },
    { id: 4, name: 'Racing Pro', players: 890, status: 'Active' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Games</h1>
          <p className="text-slate-500 mt-1">Manage your game library</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
          <Plus size={20} />
          Add Game
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Gamepad2 className="text-white" size={28} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{game.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  game.status === 'Active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {game.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Active Players</span>
              <span className="font-semibold text-slate-700">{game.players}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
