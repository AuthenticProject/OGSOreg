import React, { useState, useMemo } from 'react'

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

export interface OfficialFinalistsTableProps {
  showHeader?: boolean
}

export const OfficialFinalistsTable: React.FC<OfficialFinalistsTableProps> = ({ showHeader = true }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampus, setSelectedCampus] = useState('')
  const [selectedJenjang, setSelectedJenjang] = useState<number>(0) // 0 = Semua

  // Distinct campuses sorted alphabetically
  const campuses = useMemo(() => {
    const set = new Set<string>()
    OFFICIAL_FINALISTS_2026.forEach((r) => set.add(r[4]))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))
  }, [])

  // Filtered dataset matching index (1).html logic
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return OFFICIAL_FINALISTS_2026.filter((r) => {
      const matchJenjang = !selectedJenjang || r[0] === selectedJenjang
      const matchCampus = !selectedCampus || r[4] === selectedCampus
      const matchQuery = !q || (r[2] + ' ' + r[4]).toLowerCase().includes(q)
      return matchJenjang && matchCampus && matchQuery
    })
  }, [searchQuery, selectedCampus, selectedJenjang])

  return (
    <section id="pengumuman-hasil" className="w-full bg-[#f6f8f5] dark:bg-[#0d1511] text-[#14231c] dark:text-[#e8f0eb] transition-colors pb-16">
      {/* Hero Header matching index (1).html */}
      {showHeader && (
        <div className="bg-gradient-to-br from-[#0a4f37] via-[#0f6b4a] to-[#1a8a60] text-white pt-14 pb-20 px-5 text-center">
          <span className="inline-block tracking-widest font-bold text-xs bg-white/15 px-3.5 py-1.5 rounded-full mb-4 uppercase">
            BABAK FINAL · 2026
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3">
            Selamat kepada <span className="text-[#f3d27a]">Para Finalis</span> OGSO 2026
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base opacity-90 leading-relaxed font-normal">
            Online Gontor Science Olympiad — berikut peserta yang berhasil lolos ke babak final.
          </p>
        </div>
      )}

      <div className={`max-w-[1000px] mx-auto px-4 ${!showHeader ? 'pt-8' : ''}`}>
        {/* Metric Summary Cards (-40px negative margin matching index (1).html) */}
        <div className="grid grid-cols-3 gap-3 -mt-10 mb-6">
          <div className="bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl p-3.5 text-center shadow-lg">
            <b className="block text-2xl sm:text-3xl font-extrabold text-[#0f6b4a] dark:text-[#4fc08f]">
              {OFFICIAL_FINALISTS_2026.length}
            </b>
            <span className="text-xs sm:text-sm text-[#5b6b62] dark:text-[#93a69b]">Finalis</span>
          </div>
          <div className="bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl p-3.5 text-center shadow-lg">
            <b className="block text-2xl sm:text-3xl font-extrabold text-[#0f6b4a] dark:text-[#4fc08f]">
              5
            </b>
            <span className="text-xs sm:text-sm text-[#5b6b62] dark:text-[#93a69b]">Jenjang</span>
          </div>
          <div className="bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl p-3.5 text-center shadow-lg">
            <b className="block text-2xl sm:text-3xl font-extrabold text-[#0f6b4a] dark:text-[#4fc08f]">
              {campuses.length}
            </b>
            <span className="text-xs sm:text-sm text-[#5b6b62] dark:text-[#93a69b]">Kampus</span>
          </div>
        </div>

        {/* Tools: Input Search & Campus Select matching index (1).html */}
        <div className="flex flex-col gap-3 my-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau kampus…"
                autoComplete="off"
                className="w-full bg-white dark:bg-[#14201a] text-[#14231c] dark:text-[#e8f0eb] border border-[#dfe7e1] dark:border-[#233229] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a] dark:focus:ring-[#4fc08f] transition-all"
              />
            </div>
            <div>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full bg-white dark:bg-[#14201a] text-[#14231c] dark:text-[#e8f0eb] border border-[#dfe7e1] dark:border-[#233229] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a] dark:focus:ring-[#4fc08f] transition-all cursor-pointer"
              >
                <option value="">Semua kampus</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chips: Semua, Jenjang 1 - 5 matching index (1).html */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[0, 1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedJenjang(lvl)}
                className={`text-sm font-semibold cursor-pointer border rounded-full px-3.5 py-1.5 transition-all ${
                  selectedJenjang === lvl
                    ? 'bg-[#0f6b4a] dark:bg-[#4fc08f] text-white dark:text-[#0d1511] border-[#0f6b4a] dark:border-[#4fc08f]'
                    : 'bg-white dark:bg-[#14201a] text-[#14231c] dark:text-[#e8f0eb] border-[#dfe7e1] dark:border-[#233229] hover:bg-[#eef4f0] dark:hover:bg-[#192a21]'
                }`}
              >
                {lvl === 0 ? 'Semua' : `Jenjang ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        {/* Counter matching index (1).html */}
        <div className="text-sm text-[#5b6b62] dark:text-[#93a69b] my-2">
          Menampilkan {filteredData.length} dari {OFFICIAL_FINALISTS_2026.length} finalis
        </div>

        {/* Table View matching index (1).html */}
        <div className="overflow-x-auto bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl shadow-sm mb-12">
          <table className="w-full border-collapse text-sm min-w-[560px]">
            <thead>
              <tr className="bg-[#eef4f0] dark:bg-[#192a21] text-xs uppercase tracking-wider text-[#5b6b62] dark:text-[#93a69b] sticky top-0">
                <th className="py-3 px-3.5 w-14 text-center border-b border-[#dfe7e1] dark:border-[#233229]">No</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Nama</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Jenjang</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Kelas</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Kampus</th>
                <th className="py-3 px-3.5 text-right font-extrabold text-[#0f6b4a] dark:text-[#4fc08f] border-b border-[#dfe7e1] dark:border-[#233229]">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => {
                  const [jenjang, noInJenjang, nama, kelas, kampus, nilai] = row
                  const displayNo =
                    selectedJenjang && !selectedCampus && !searchQuery ? noInJenjang : idx + 1

                  return (
                    <tr
                      key={`${jenjang}-${nama}-${kampus}`}
                      className="border-b border-[#dfe7e1] dark:border-[#233229] hover:bg-[#e6f3ec] dark:hover:bg-[#173126] transition-colors"
                    >
                      <td className="py-2.5 px-3.5 text-center text-xs text-[#5b6b62] dark:text-[#93a69b]">
                        {displayNo}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#14231c] dark:text-[#e8f0eb] min-w-[180px]">
                        {nama}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-block text-xs font-bold text-[#0f6b4a] dark:text-[#4fc08f] bg-[#e6f3ec] dark:bg-[#173126] px-2.5 py-0.5 rounded-full">
                          Jenjang {jenjang}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[#14231c] dark:text-[#e8f0eb]">
                        {kelas}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#14231c] dark:text-[#e8f0eb]">
                        {kampus}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-extrabold text-[#0f6b4a] dark:text-[#4fc08f]">
                        {nilai}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-[#5b6b62] dark:text-[#93a69b] py-9">
                    Tidak ada finalis yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer matching index (1).html */}
        <div className="text-center text-xs text-[#5b6b62] dark:text-[#93a69b] pt-6 pb-10 border-t border-[#dfe7e1] dark:border-[#233229]">
          Daftar finalis OGSO 2026 · Informasi lengkap di{' '}
          <a href="https://ogsoreg.vercel.app/" className="text-[#0f6b4a] dark:text-[#4fc08f] font-bold hover:underline">
            ogsoreg.vercel.app
          </a>
        </div>
      </div>
    </section>
  )
}
