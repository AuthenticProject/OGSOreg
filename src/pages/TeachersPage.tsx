import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Plus,
  Phone,
  Mail,
  Building2,
  Users,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/feedback/EmptyState'
import { TableLoadingSkeleton } from '../components/feedback/LoadingSkeleton'
import { teacherRepository } from '../services/supabase/teacherRepository'
import { useAuth } from '../context/AuthContext'
import type { TeacherEntity } from '../types/database'

export const TeachersPage: React.FC = () => {
  const { institution } = useAuth()
  const [teachers, setTeachers] = useState<TeacherEntity[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    teacherRepository
      .getTeachers(institution?.id)
      .then((data) => {
        setTeachers(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [institution?.id])

  const filteredTeachers = teachers.filter((t) =>
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.phone && t.phone.includes(searchTerm)) ||
    (t.nip_nik && t.nip_nik.includes(searchTerm))
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guru Pembimbing"
        subtitle="Daftar guru pendamping dan pembimbing kontingen yang terdaftar di basis data."
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {teachers.length} Guru Terdata
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
          >
            Tambah Guru
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-border shadow-subtle">
        <SearchInput
          value={searchTerm}
          onChangeValue={setSearchTerm}
          placeholder="Cari nama guru, nomor kontak, atau NIP/NIK..."
          className="w-full sm:w-80"
        />
      </div>

      {loading ? (
        <div className="bg-white p-6 rounded-xl border border-border">
          <TableLoadingSkeleton rows={4} columns={4} />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <EmptyState
          title="Tidak Ada Guru Ditemukan"
          description="Belum ada data guru pembimbing yang tersimpan atau cocok dengan kata kunci pencarian."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="p-5 rounded-xl border border-border bg-white shadow-subtle hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-maroon/10 text-brand-maroon flex items-center justify-center font-bold shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {teacher.full_name}
                    </h3>
                    <p className="text-xs text-brand-maroon font-medium">
                      Guru Pembimbing Delegasi
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      NIP/NIK: {teacher.nip_nik || '-'}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  <Users className="w-3 h-3 text-slate-500" />
                  {teacher.gender === 'L' ? 'Laki-laki' : teacher.gender === 'P' ? 'Perempuan' : '-'}
                </span>
              </div>

              <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700 font-medium">
                    {institution?.name || 'Pondok Modern Darussalam Gontor'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{teacher.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{teacher.email || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
