import React, { useState } from 'react'
import {
  Building2,
  Plus,
  MapPin,
  User,
  Phone,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { mockSchools } from '../lib/mockData'

export const SchoolsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSchools = mockSchools.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.npsn.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sekolah & Lembaga Mitra"
        subtitle="Daftar institusi, madrasah, dan pesantren yang telah mendaftarkan kontingen."
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {mockSchools.length} Sekolah
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
          >
            Tambah Sekolah
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-border shadow-subtle">
        <SearchInput
          value={searchTerm}
          onChangeValue={setSearchTerm}
          placeholder="Cari nama sekolah, kota, NPSN..."
          className="w-full sm:w-80"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="p-5 rounded-xl border border-border bg-white shadow-subtle hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-gold/15 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {school.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {school.type}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      NPSN: {school.npsn}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-brand-maroon block">
                  {school.totalParticipants} Peserta
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {school.totalTeachers} Guru
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{school.city}, {school.province}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700 font-medium">PIC: {school.picName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{school.picPhone}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
