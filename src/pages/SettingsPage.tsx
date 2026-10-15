import React from 'react'
import {
  Save,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi preferensi organisasi, informasi kontak penanggung jawab, dan akun pendaftaran."
      />

      <SectionCard title="Profil Institusi Utama" subtitle="Informasi ini dicetak otomatis pada rekap dan kartu peserta">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nama Lembaga / Sekolah</label>
            <input
              type="text"
              defaultValue="SMA Darussalam Boarding School"
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-maroon"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nomor Pokok Sekolah Nasional (NPSN)</label>
            <input
              type="text"
              defaultValue="20108492"
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-maroon font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nama Penanggung Jawab (PIC)</label>
            <input
              type="text"
              defaultValue="H. Lukman Hakim, S.E."
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-maroon"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">No. WhatsApp PIC</label>
            <input
              type="text"
              defaultValue="081288990011"
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#22C55E] font-mono"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-4 h-4 mr-1.5" />}
            onClick={() => alert('Preferensi berhasil disimpan (mock local state).')}
          >
            Simpan Perubahan
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Tema & Tampilan" subtitle="Pengaturan identitas warna dan mode tampilan sistem">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#166534] border-2 border-white shadow-sm" />
            <div>
              <p className="text-xs font-bold text-slate-900">Tema Resmi OGSOreg (Forest Green & Emerald)</p>
              <p className="text-[11px] text-muted-foreground">Palet warna resmi hijau OGSOreg (#166534 & #22C55E)</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Aktif</span>
        </div>
      </SectionCard>
    </div>
  )
}
