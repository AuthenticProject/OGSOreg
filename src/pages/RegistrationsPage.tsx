import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet,
  Eye,
  Calendar,
  Users,
  GraduationCap,
  Info,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { SectionCard } from '../components/ui/SectionCard'
import { mockRecentImports } from '../lib/mockData'

export const RegistrationsPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Pendaftaran Kontingen"
        subtitle="Kelola kumpulan berkas pendaftaran (batch) yang diimpor dari berbagai institusi."
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/imports')}
            leftIcon={<FileSpreadsheet className="w-4 h-4 mr-2" />}
          >
            Import Batch Baru
          </Button>
        }
      />

      {/* Info notice explaining sample nature before DB persistence */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          <strong>Informasi:</strong> Riwayat di bawah merupakan data sampel untuk pengujian tata letak. Sesi pendaftaran dari modul Impor saat ini diproses secara lokal (in-memory) dan akan dikoneksikan ke basis data permanen pada Phase 4.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockRecentImports.map((batch) => (
          <SectionCard key={batch.id} className="hover:border-slate-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-foreground">
                    {batch.batchName}
                  </h3>
                  <StatusBadge status={batch.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {batch.institutionName} • Berkas sumber: <span className="font-mono text-slate-700">{batch.sourceFilename}</span>
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-600 pt-2">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{batch.totalParticipants}</strong> Peserta
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{batch.totalTeachers}</strong> Guru
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {batch.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/students')}
                  leftIcon={<Eye className="w-3.5 h-3.5 mr-1.5" />}
                >
                  Buka Siswa Saya
                </Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  )
}
