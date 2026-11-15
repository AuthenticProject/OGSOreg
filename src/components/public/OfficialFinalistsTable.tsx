import React, { useState, useMemo } from 'react'
import { Search, Trophy, ExternalLink, Filter } from 'lucide-react'

// Official Finalists Dataset from Petunjuk & Rekapitulasi Babak Penyisihan OGSO 2026
// Format: [jenjang, no urut dalam jenjang, nama, kelas, kampus, nilai]
export const OFFICIAL_FINALISTS_2026: [number, number, string, string, string, number][] = [
  [1, 1, 'Fathimah Mutiara Harida', '1-H', 'Gontor Putri 1', 56],
  [1, 2, 'Azel Karunia', '1', 'Gontor Putri 2', 56],
  [1, 3, 'Nagita Aisha', '1', 'Gontor Putri 2', 54],
  [1, 4, 'Hafidh Hamizan', '1', 'Gontor 2', 54],
  [1, 5, 'Rania Arnetta', '1', 'Gontor Putri 2', 53],
  [1, 6, 'Muhammad Umar', '1-C', 'Gontor 4', 52],
  [1, 7, 'Muhammad Fatih Nuruddin', '1-C', 'Gontor 1', 51],
  [1, 8, 'Revalya Nurul Maulida', '1-C', 'Gontor Putri 1', 50],
  [1, 9, 'Azka Rahardino', '1', 'Gontor 2', 50],
  [1, 10, 'Najwa Raihanah', '1-B', 'Gontor Putri 8', 49],
  [1, 11, 'Brilliant Surya', '1', 'Gontor 2', 49],
  [1, 12, 'Candra Wahyu', '1-B', 'Gontor Putri 8', 49],
  [1, 13, 'Resa Asyukur', '1', 'Gontor 2', 48],
  [1, 14, 'Ravif Budiono', '1-C', 'Gontor 4', 47],
  [1, 15, 'Moh Robby', '1-C', 'Gontor 4', 46],
  [1, 16, "Naufal Ma'arif", '1', 'Gontor 7', 46],
  [1, 17, 'Adeeva Ghaitsa Kurnia', '1-H', 'Gontor Putri 1', 46],
  [1, 18, 'Fikri Nakhla', '1', 'Gontor 7', 45],
  [1, 19, 'Masya Fadiya', '1-B', 'Gontor Putri 8', 44],
  [1, 20, 'Luthfi Arzana', '1-B', 'Gontor Putri 8', 43],
  [2, 1, 'Rayya Almahyra', '2-E', 'Gontor Putri 1', 62],
  [2, 2, 'Nada Nisrina Hasna Nadhifa', '2-E', 'Gontor Putri 1', 58],
  [2, 3, 'Muhammad Alfathih', '2-G', 'Gontor 1', 56],
  [2, 4, 'Annisa Aini', '2-F', 'Gontor Putri 4', 54],
  [2, 5, 'Ahmad Farhan', '2-B', 'Gontor 4', 52],
  [2, 6, 'Muhammad Cedric', '2-C', 'Gontor 4', 49],
  [2, 7, 'Farah Sidqiya', '2-B', 'Gontor Putri 8', 49],
  [2, 8, 'Nufail Jinan', '2-C', 'Gontor 5', 48],
  [2, 9, 'Shafira Linggasatya', '2-F', 'Gontor Putri 4', 48],
  [2, 10, 'Abdullah Faqih Rahman', '2-B', 'Gontor 10', 47],
  [2, 11, 'Khalwa Mafaza Qonita', '2-E', 'Gontor Putri 1', 44],
  [2, 12, 'Naia Salsabila', '2-B', 'Gontor Putri 8', 44],
  [2, 13, 'Rafif Ahmad Maulana', '2-B', 'Gontor 11', 44],
  [2, 14, 'Bening Cahaya Firdausi', '2-G', 'Gontor Putri 1', 44],
  [2, 15, 'Dzakiyul Baahir Al Majid', '2-G', 'Gontor 1', 44],
  [2, 16, 'Zidna Rohmah Laila', '2-I', 'Gontor Putri 3', 44],
  [2, 17, 'Muhammad Rafif', '2-E', 'Gontor 4', 43],
  [2, 18, 'Muhammad Arqian Karim', '2-D', 'Gontor 1', 42],
  [2, 19, 'Muhammad Arif Cahyanda', '2-B', 'Gontor 10', 42],
  [2, 20, 'Airah Fitrah', '2-B', 'Gontor Putri 7', 42],
  [3, 1, 'Neutral Sakka Fudianto', '3-B', 'Gontor 1', 62],
  [3, 2, 'Ridwan Abqary Noor Ahmad', '3-B', 'Gontor 1', 60],
  [3, 3, 'Safaraz Akma', '1 int', 'Gontor 2', 55],
  [3, 4, 'Aulya Widjayati Nugroho', '3-B', 'Gontor Putri 1', 55],
  [3, 5, 'Hasni Aulia', '1 int B', 'Gontor Putri 1', 54],
  [3, 6, 'Izzatunnisa El-Mahira', '3-B', 'Gontor Putri 1', 52],
  [3, 7, 'Theona Afifah Elysia', '3-B', 'Gontor Putri 1', 52],
  [3, 8, 'Bella Niisa', '3-B', 'Gontor Putri 4', 50],
  [3, 9, 'Syaca Faiz', '1 int', 'Gontor 2', 48],
  [3, 10, 'Haura Qulbi', '3-B', 'Gontor Putri 4', 48],
  [3, 11, 'Zaskia Riena', '1 int', 'Gontor Putri 2', 46],
  [3, 12, 'Sofiya Anjuna', '1 int', 'Gontor Putri 2', 46],
  [3, 13, 'Novan Azzam', '1 int', 'Gontor 2', 45],
  [3, 14, 'Omar Jahran Sarwoaji', '3-K', 'Gontor 1', 45],
  [3, 15, 'Hafiz Arsyad', '3-B', 'Gontor 4', 44],
  [3, 16, 'Rizky Aulia', '3-B', 'Gontor Putri 7', 44],
  [3, 17, 'Arsya Zivanka', '3-B', 'Gontor Putri 6', 43],
  [3, 18, 'Alya Carissa', '3-B', 'Gontor Putri 8', 43],
  [3, 19, 'Vania Mustari', '3-B', 'Gontor Putri 4', 42],
  [3, 20, 'Elfachry Nuswantoro', '3-B', 'Gontor 4', 42],
  [3, 21, 'Kadiza Queena Reaji Putri', '3-B', 'Gontor Putri 3', 42],
  [4, 1, 'Athiyyah Meiogyne', '4-B', 'Gontor Putri 8', 52],
  [4, 2, 'Raifal Sugiono', '3 int B', 'Gontor 1', 50],
  [4, 3, 'Zahira Aqila', '4-B', 'Gontor Putri 8', 48],
  [4, 4, 'Rahmania Nazla', '4-B', 'Gontor Putri 6', 45],
  [4, 5, 'Marwah Naila', '4-B', 'Gontor Putri 8', 44],
  [4, 6, 'Shafa Azzahra Chusnul Khotim', '4-B', 'Gontor Putri 1', 44],
  [4, 7, 'Salsabila Auliyannisa Giyatmoko', '3 int C', 'Gontor Putri 3', 44],
  [4, 8, 'Alfi Syabil', '4-D', 'Gontor 4', 43],
  [4, 9, 'Delima Izanagi Khalesa', '3 int B', 'Gontor Putri 1', 42],
  [4, 10, 'Fikri Al-fadhil', '4-B', 'Gontor 5', 41],
  [4, 11, 'Muhammad Khawarizmi Avicena', '3 int F', 'Gontor 1', 40],
  [4, 12, 'Naufal Mufid', '3 int B', 'Gontor 1', 40],
  [4, 13, 'Umar Hasan', '4-D', 'Gontor 4', 40],
  [4, 14, 'Noer Huda', '4-B', 'Gontor 5', 39],
  [4, 15, 'Lalitya Suherman', '4-B', 'Gontor Putri 6', 39],
  [4, 16, 'Kanugrahan Prasetya Jati', '4-B', 'Gontor 3', 38],
  [4, 17, 'Sania Mareta Putri', '3 int B', 'Gontor Putri 7', 38],
  [4, 18, 'Aiesha Valerie Cahyana Putri', '3 int C', 'Gontor Putri 3', 38],
  [4, 19, 'Reynard Ality', '4-C', 'Gontor 7', 37],
  [4, 20, 'Fahri Zafran', '3 int B', 'Gontor 7', 37],
  [5, 1, 'Luqmanul Hakim Rahmatulloh', '5-B', 'Gontor 3', 49],
  [5, 2, 'Saniya Ayu Safira', '5-B', 'Gontor Putri 1', 46],
  [5, 3, 'Ossie Aliandra', '5-B', 'Gontor Putri 1', 45],
  [5, 4, 'Fanisha Hasbi Ataya', '5-B', 'Gontor Putri 7', 43],
  [5, 5, 'Lakeisha Nadhifa Khansa', '5-B', 'Gontor Putri 7', 43],
  [5, 6, 'Mumtaz Taruna', '5-B', 'Gontor Putri 6', 42],
  [5, 7, 'Faridus Shidqi', '5-B', 'Gontor 4', 42],
  [5, 8, 'Aufa Nuha', '5-D', 'Gontor 4', 41],
  [5, 9, 'Arroyan Alam', '5-C', 'Gontor 4', 40],
  [5, 10, 'Chalisa Safira Putri', '5-B', 'Gontor Putri 1', 40],
  [5, 11, 'Salsabila Nadhifa Aqila', '5-B', 'Gontor Putri 1', 39],
  [5, 12, 'Muhammad Safa Azzam Al-wathon', '5-Q', 'Gontor 1', 38],
  [5, 13, 'Syifa Ramadhani', '5-B', 'Gontor Putri 7', 37],
  [5, 14, 'Dwizia Elzafira', '5-B', 'Gontor Putri 8', 37],
  [5, 15, 'Zaid Bahrul', '5-B', 'Gontor 7', 37],
  [5, 16, 'Nakhwah Nisaul Jinan', '5-B', 'Gontor Putri 3', 37],
  [5, 17, 'Jauza Dzakiyah', '5-C', 'Gontor Putri 8', 36],
  [5, 18, 'Khalila Maziyaturrohmah', '5-C', 'Gontor Putri 3', 36],
  [5, 19, 'Farhan Elrasyid', '5-B', 'Gontor 7', 35],
  [5, 20, 'Muhammad Adly Ridwan', '5-B', 'Gontor 3', 35],
]

export const OfficialFinalistsTable: React.FC<{ showHeader?: boolean }> = ({
  showHeader = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampus, setSelectedCampus] = useState('')
  const [selectedJenjang, setSelectedJenjang] = useState<number>(0) // 0 = Semua

  // Distinct campuses sorted alphabetically with numbers properly ordered
  const campuses = useMemo(() => {
    const set = new Set<string>()
    OFFICIAL_FINALISTS_2026.forEach((r) => set.add(r[4]))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))
  }, [])

  // Filtered dataset
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return OFFICIAL_FINALISTS_2026.filter((r) => {
      const matchJenjang = !selectedJenjang || r[0] === selectedJenjang
      const matchCampus = !selectedCampus || r[4] === selectedCampus
      const matchQuery = !q || (r[2] + ' ' + r[4] + ' ' + r[3]).toLowerCase().includes(q)
      return matchJenjang && matchCampus && matchQuery
    })
  }, [searchQuery, selectedCampus, selectedJenjang])

  return (
    <section id="pengumuman-hasil" className="py-12 sm:py-16 bg-[#0B1E17] text-white relative">
      {showHeader && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold tracking-wider text-emerald-300 uppercase">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            BABAK FINAL · OGSO 2026
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Selamat kepada <span className="text-amber-300">Para Finalis</span> OGSO 2026
          </h2>
          <p className="max-w-2xl mx-auto text-emerald-100/80 text-sm sm:text-base leading-relaxed">
            Online Gontor Science Olympiad — berikut daftar resmi peserta yang berhasil lolos ke
            babak final berdasarkan hasil rekapitulasi nilai seleksi penyisihan.
          </p>

          <div className="pt-2">
            <a
              href="/finalis.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-600/50 transition-colors shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tampilan Penuh (Standalone HTML)</span>
            </a>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#122A21] border border-emerald-800/60 rounded-2xl p-3 sm:p-4 text-center shadow-lg">
            <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {OFFICIAL_FINALISTS_2026.length}
            </span>
            <span className="text-[11px] sm:text-xs text-emerald-200/70 font-medium">Total Finalis</span>
          </div>
          <div className="bg-[#122A21] border border-emerald-800/60 rounded-2xl p-3 sm:p-4 text-center shadow-lg">
            <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400">5</span>
            <span className="text-[11px] sm:text-xs text-emerald-200/70 font-medium">Jenjang Lomba</span>
          </div>
          <div className="bg-[#122A21] border border-emerald-800/60 rounded-2xl p-3 sm:p-4 text-center shadow-lg">
            <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {campuses.length}
            </span>
            <span className="text-[11px] sm:text-xs text-emerald-200/70 font-medium">Kampus Terwakili</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#10251D] border border-emerald-800/70 rounded-2xl p-4 space-y-3.5 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama santri, kelas, atau kampus..."
                className="w-full bg-[#163228] border border-emerald-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-emerald-300/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full bg-[#163228] border border-emerald-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="">Semua Kampus ({campuses.length})</option>
                {campuses.map((c) => (
                  <option key={c} value={c} className="bg-[#10251D]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Jenjang Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-800/50">
            <span className="text-xs text-emerald-300/70 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Jenjang:
            </span>
            {[0, 1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedJenjang(lvl)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedJenjang === lvl
                    ? 'bg-emerald-500 text-[#0B1E17] font-bold shadow-md'
                    : 'bg-[#163228] text-emerald-100/80 hover:bg-emerald-800/60 border border-emerald-700/50'
                }`}
              >
                {lvl === 0 ? 'Semua Jenjang' : `Jenjang ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-emerald-300/80 px-1">
          <span>
            Menampilkan <strong className="text-emerald-200">{filteredData.length}</strong> dari{' '}
            {OFFICIAL_FINALISTS_2026.length} finalis
          </span>
          {(searchQuery || selectedCampus || selectedJenjang !== 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCampus('')
                setSelectedJenjang(0)
              }}
              className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto bg-[#10251D] border border-emerald-800/70 rounded-2xl shadow-xl">
          <table className="w-full text-left text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-[#142F24] text-emerald-300/90 text-xs uppercase tracking-wider border-b border-emerald-800/70">
                <th className="py-3 px-4 w-14 text-center font-bold">No</th>
                <th className="py-3 px-4 font-bold">Nama Finalis</th>
                <th className="py-3 px-4 font-bold">Jenjang</th>
                <th className="py-3 px-4 font-bold">Kelas</th>
                <th className="py-3 px-4 font-bold">Kampus</th>
                <th className="py-3 px-4 text-right font-bold w-20">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-800/40 text-emerald-100">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => {
                  const [jenjang, noInJenjang, nama, kelas, kampus, nilai] = row
                  const displayNo =
                    selectedJenjang && !selectedCampus && !searchQuery ? noInJenjang : idx + 1

                  return (
                    <tr key={`${jenjang}-${nama}-${kampus}`} className="hover:bg-emerald-900/30 transition-colors">
                      <td className="py-3 px-4 text-center text-xs font-mono text-emerald-300/80">
                        {displayNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {nama}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Jenjang {jenjang}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-200/90 text-xs">
                        {kelas}
                      </td>
                      <td className="py-3 px-4 text-emerald-100 font-medium text-xs">
                        {kampus}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-300 font-mono">
                        {nilai}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-emerald-300/60 text-sm">
                    Tidak ada finalis yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
