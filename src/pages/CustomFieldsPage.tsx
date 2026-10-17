import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Info,
  X,
  Lock,
  Sparkles,
  Check,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import { customFieldService } from '../services/customFieldService'
import { generateRegistrationTemplate } from '../services/excelGenerator'
import {
  type CustomFieldDefinition,
  type CustomFieldType,
  CUSTOM_FIELD_TYPE_OPTIONS,
  validateMoodleDestinationHeader,
  STANDARD_MOODLE_FIELDS,
} from '../types/customField'

// Standard mandatory columns in OGSOreg Excel Template
const STANDARD_EXCEL_COLUMNS = [
  { key: 'no', label: 'No.', description: 'Nomor urut otomatis santri', required: false, locked: true },
  { key: 'username', label: 'Username Moodle', description: 'Username unik login Moodle santri', required: true, locked: true },
  { key: 'firstname', label: 'Nama Depan', description: 'Nama depan santri', required: true, locked: true },
  { key: 'lastname', label: 'Nama Belakang', description: 'Nama belakang / keluarga santri', required: false, locked: true },
  { key: 'email', label: 'Email Santri', description: 'Alamat email aktif untuk notifikasi', required: true, locked: true },
  { key: 'jenjang', label: 'Jenjang Santri', description: 'Pilihan dropdown: Kelas 1, 2, 3, 4, 5', required: true, locked: true },
  { key: 'kampus', label: 'Kampus Gontor', description: 'Pilihan dropdown: 20 Kampus Resmi Gontor', required: true, locked: true },
]

// Standard mandatory columns in Moodle CSV Bulk User Upload (7 Columns)
const MANDATORY_MOODLE_COLUMNS = [
  { header: 'username', source: 'Username Santri', description: 'ID login peserta di Moodle LMS', required: true },
  { header: 'firstname', source: 'Nama Depan', description: 'Nama depan santri', required: true },
  { header: 'lastname', source: 'Nama Belakang', description: 'Nama belakang santri', required: true },
  { header: 'email', source: 'Email Santri', description: 'Alamat email akun Moodle', required: true },
  { header: 'course1', source: 'Kursus Utama (Kategori Lomba)', description: 'Moodle shortname kursus utama', required: true },
  { header: 'course2', source: 'Kursus Sesi (Waktu Ujian)', description: 'Moodle shortname sesi ujian santri', required: true },
  { header: 'password', source: 'Password Default (OGSO2026)', description: 'Kata sandi awal santri di Moodle', required: true },
]

export const CustomFieldsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Active Tab: 'excel' | 'moodle' | 'fields'
  const activeTab = (searchParams.get('tab') as 'excel' | 'moodle' | 'fields') || 'excel'

  const setActiveTab = (tab: 'excel' | 'moodle' | 'fields') => {
    setSearchParams({ tab })
  }

  const [fields, setFields] = useState<CustomFieldDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingPreview, setIsDownloadingPreview] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [deletingField, setDeletingField] = useState<CustomFieldDefinition | null>(null)

  // Form State
  const [formLabel, setFormLabel] = useState('')
  const [formKey, setFormKey] = useState('')
  const [formType, setFormType] = useState<CustomFieldType>('text')
  const [formRequired, setFormRequired] = useState(false)
  const [formActive, setFormActive] = useState(true)
  const [formIncludeExcel, setFormIncludeExcel] = useState(true)
  const [formIncludeMoodle, setFormIncludeMoodle] = useState(false)
  const [formMoodleDest, setFormMoodleDest] = useState('')
  const [formDropdownOptions, setFormDropdownOptions] = useState('')
  const [formPlaceholder, setFormPlaceholder] = useState('')
  const [formHelperText, setFormHelperText] = useState('')
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({})
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false)

  // Quick edit moodle header inline
  const [editingMoodleFieldId, setEditingMoodleFieldId] = useState<string | null>(null)
  const [inlineMoodleHeader, setInlineMoodleHeader] = useState('')
  const [inlineMoodleError, setInlineMoodleError] = useState<string | null>(null)

  // Quick inline edit field label (used in Tab 1 Excel and Tab 2 Moodle)
  const [editingLabelFieldId, setEditingLabelFieldId] = useState<string | null>(null)
  const [inlineLabelValue, setInlineLabelValue] = useState('')
  const [inlineLabelError, setInlineLabelError] = useState<string | null>(null)

  const handleStartEditingLabel = (field: CustomFieldDefinition) => {
    setEditingLabelFieldId(field.id)
    setInlineLabelValue(field.label)
    setInlineLabelError(null)
  }

  const handleCancelEditingLabel = () => {
    setEditingLabelFieldId(null)
    setInlineLabelValue('')
    setInlineLabelError(null)
  }

  const handleSaveInlineLabel = async (field: CustomFieldDefinition) => {
    const trimmed = inlineLabelValue.trim()
    if (!trimmed) {
      setInlineLabelError('Nama label kolom tidak boleh kosong.')
      return
    }

    const res = await customFieldService.saveCustomField({
      ...field,
      label: trimmed,
    })

    if (res.success) {
      setEditingLabelFieldId(null)
      setInlineLabelError(null)
      showFeedback('success', `Nama kolom diperbarui menjadi "${trimmed}".`)
    } else {
      setInlineLabelError(res.error || 'Gagal menyimpan perubahan nama.')
    }
  }

  // Toggle Required directly from table
  const handleToggleRequired = async (field: CustomFieldDefinition) => {
    const nextVal = !field.is_required
    const res = await customFieldService.saveCustomField({
      ...field,
      is_required: nextVal,
    })
    if (res.success) {
      showFeedback('success', `Status bidang '${field.label}' diubah menjadi ${nextVal ? 'Wajib' : 'Opsional'}.`)
    } else {
      showFeedback('error', res.error || 'Gagal mengubah status wajib.')
    }
  }

  // Subscribe to customFieldService
  useEffect(() => {
    const unsubscribe = customFieldService.subscribe((updated) => {
      setFields(updated)
      setIsLoading(false)
    })

    customFieldService.getCustomFields().then((initial) => {
      setFields(initial)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Auto-slugify label into key
  const handleLabelChange = (newLabel: string) => {
    setFormLabel(newLabel)
    if (!isKeyManuallyEdited && !editingFieldId) {
      const slug = newLabel
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      setFormKey(slug)
      if (formIncludeMoodle && slug) {
        setFormMoodleDest(`profile_field_${slug}`)
      }
    }
  }

  // Open Add Modal with optional preset
  const handleOpenAddModal = (preset?: { include_in_excel?: boolean; include_in_moodle?: boolean } | React.MouseEvent) => {
    const isPresetObj = preset && !('nativeEvent' in preset)
    const presetConfig = isPresetObj ? (preset as { include_in_excel?: boolean; include_in_moodle?: boolean }) : undefined

    setEditingFieldId(null)
    setFormLabel('')
    setFormKey('')
    setFormType('text') // Default free-form text
    setFormRequired(false)
    setFormActive(true)
    setFormIncludeExcel(presetConfig?.include_in_excel !== undefined ? presetConfig.include_in_excel : true)
    setFormIncludeMoodle(presetConfig?.include_in_moodle !== undefined ? presetConfig.include_in_moodle : activeTab === 'moodle')
    setFormMoodleDest('')
    setFormDropdownOptions('')
    setFormPlaceholder('')
    setFormHelperText('')
    setIsKeyManuallyEdited(false)
    setModalErrors({})
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (field: CustomFieldDefinition) => {
    setEditingFieldId(field.id)
    setFormLabel(field.label)
    setFormKey(field.key)
    setFormType(field.field_type)
    setFormRequired(field.is_required)
    setFormActive(field.is_active)
    setFormIncludeExcel(field.include_in_excel)
    setFormIncludeMoodle(field.include_in_moodle)
    setFormMoodleDest(field.moodle_destination || '')
    setFormDropdownOptions(field.options?.join('\n') || '')
    setFormPlaceholder(field.validation_rules?.placeholder || '')
    setFormHelperText(field.validation_rules?.helperText || '')
    setIsKeyManuallyEdited(true)
    setModalErrors({})
    setIsModalOpen(true)
  }

  // Toggle Active/Inactive
  const handleToggleActive = async (field: CustomFieldDefinition) => {
    const res = await customFieldService.toggleFieldActive(field.id, !field.is_active)
    if (res.success) {
      showFeedback(
        'success',
        `Bidang '${field.label}' berhasil ${!field.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`
      )
    } else {
      showFeedback('error', res.error || 'Gagal mengubah status bidang.')
    }
  }

  // 1-Click Toggle for Include in Excel Template
  const handleToggleIncludeExcel = async (field: CustomFieldDefinition) => {
    const nextVal = !field.include_in_excel
    const res = await customFieldService.saveCustomField({
      ...field,
      include_in_excel: nextVal,
    })
    if (res.success) {
      showFeedback(
        'success',
        `Kolom '${field.label}' ${nextVal ? 'sekarang disertakan di' : 'dikeluarkan dari'} template Excel pendaftaran.`
      )
    } else {
      showFeedback('error', res.error || 'Gagal memperbarui kolom Excel.')
    }
  }

  // 1-Click Toggle for Include in Moodle CSV Export
  const handleToggleIncludeMoodle = async (field: CustomFieldDefinition) => {
    const nextVal = !field.include_in_moodle
    const defaultDest = field.moodle_destination || `profile_field_${field.key}`
    const res = await customFieldService.saveCustomField({
      ...field,
      include_in_moodle: nextVal,
      moodle_destination: defaultDest,
    })
    if (res.success) {
      showFeedback(
        'success',
        `Kolom '${field.label}' ${nextVal ? 'sekarang diekspor ke' : 'dikeluarkan dari'} berkas CSV Moodle (${defaultDest}).`
      )
    } else {
      showFeedback('error', res.error || 'Gagal memperbarui kolom Moodle CSV.')
    }
  }

  // Save Inline Moodle Destination Header
  const handleSaveInlineMoodleHeader = async (field: CustomFieldDefinition) => {
    const validation = validateMoodleDestinationHeader(inlineMoodleHeader)
    if (!validation.valid) {
      setInlineMoodleError(validation.error || 'Format header tidak valid.')
      return
    }

    const res = await customFieldService.saveCustomField({
      ...field,
      include_in_moodle: true,
      moodle_destination: inlineMoodleHeader.trim().toLowerCase(),
    })

    if (res.success) {
      setEditingMoodleFieldId(null)
      setInlineMoodleError(null)
      showFeedback('success', `Header tujuan Moodle untuk '${field.label}' berhasil diperbarui.`)
    } else {
      setInlineMoodleError(res.error || 'Gagal menyimpan header.')
    }
  }

  // Move Order Up/Down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return

    const newFields = [...fields]
    const temp = newFields[index]
    newFields[index] = newFields[targetIndex]
    newFields[targetIndex] = temp

    const idsInOrder = newFields.map((f) => f.id)
    await customFieldService.reorderCustomFields(idsInOrder)
    showFeedback('success', 'Urutan kolom berhasil diperbarui.')
  }

  // Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingField) return
    const success = await customFieldService.deleteCustomField(deletingField.id)
    setDeletingField(null)
    if (success) {
      showFeedback('success', `Bidang '${deletingField.label}' berhasil dihapus.`)
    } else {
      showFeedback('error', 'Gagal menghapus bidang.')
    }
  }

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalErrors({})

    const errors: Record<string, string> = {}
    if (!formLabel.trim()) {
      errors.label = 'Nama bidang / label wajib diisi.'
    }

    const cleanKey = formKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')

    if (!cleanKey) {
      errors.key = 'Internal key unik wajib diisi.'
    }

    let parsedOptions: string[] = []
    if (formType === 'dropdown') {
      parsedOptions = formDropdownOptions
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (parsedOptions.length === 0) {
        errors.dropdown = 'Untuk tipe Dropdown, masukkan minimal 1 opsi pilihan.'
      }
    }

    if (formIncludeMoodle) {
      const moodleVal = validateMoodleDestinationHeader(formMoodleDest)
      if (!moodleVal.valid) {
        errors.moodle = moodleVal.error || 'Header Moodle tidak valid.'
      }
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors)
      return
    }

    const res = await customFieldService.saveCustomField({
      id: editingFieldId || undefined,
      key: cleanKey,
      label: formLabel.trim(),
      field_type: formType,
      is_required: formRequired,
      is_active: formActive,
      include_in_excel: formIncludeExcel,
      include_in_moodle: formIncludeMoodle,
      moodle_destination: formIncludeMoodle ? formMoodleDest.trim().toLowerCase() : undefined,
      options: parsedOptions,
      validation_rules: {
        placeholder: formPlaceholder.trim() || undefined,
        helperText: formHelperText.trim() || undefined,
      },
    })

    if (!res.success) {
      setModalErrors({ global: res.error || 'Gagal menyimpan bidang pendaftaran.' })
      return
    }

    setIsModalOpen(false)
    showFeedback(
      'success',
      `Bidang '${res.field?.label}' berhasil ${editingFieldId ? 'diperbarui' : 'ditambahkan'}.`
    )
  }

  // Download Test Template
  const handleDownloadTestTemplate = async () => {
    try {
      setIsDownloadingPreview(true)
      await generateRegistrationTemplate()
      showFeedback('success', 'Berkas template Excel dengan konfigurasi kolom saat ini berhasil diunduh.')
    } finally {
      setIsDownloadingPreview(false)
    }
  }

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  // Active custom fields in Excel
  const activeExcelCustomFields = fields.filter((f) => f.is_active && f.include_in_excel)
  // Active custom fields in Moodle
  const activeMoodleCustomFields = fields.filter((f) => f.is_active && f.include_in_moodle && f.moodle_destination)

  // Security Gate
  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Akses Terbatas — Khusus Super Admin</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Hanya Super Admin yang memiliki hak akses untuk mengonfigurasi kolom template Excel,
          ekspor Moodle CSV, dan bidang pendaftaran santri.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Pengaturan Template Excel & Ekspor Moodle CSV"
        subtitle="Atur kolom apa saja yang masuk ke template Excel input santri dan berkas ekspor Moodle CSV. Buat bidang kustom bebas tanpa batas dan petakan kolom sesuai kebutuhan."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTestTemplate}
              disabled={isDownloadingPreview}
              leftIcon={<Download className="w-4 h-4 mr-1.5 text-emerald-700" />}
            >
              {isDownloadingPreview ? 'Mengunduh...' : 'Unduh Template Excel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
            >
              Tambah Bidang Baru
            </Button>
          </div>
        }
      />

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-sm font-medium border shadow-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('excel')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
            activeTab === 'excel'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Kolom Template Excel</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'excel' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {STANDARD_EXCEL_COLUMNS.length + activeExcelCustomFields.length} Kolom
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('moodle')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
            activeTab === 'moodle'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>2. Kolom Ekspor Moodle CSV</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'moodle' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {MANDATORY_MOODLE_COLUMNS.length + activeMoodleCustomFields.length} Kolom
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all ${
            activeTab === 'fields'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. Semua Bidang Pendaftaran</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'fields' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {fields.length} Bidang
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PENGATURAN KOLOM TEMPLATE EXCEL                    */}
      {/* ======================================================== */}
      {activeTab === 'excel' && (
        <div className="space-y-5">
          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pratinjau Susunan Header Template Excel (Baris 4 Format Pendaftaran)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                Total {STANDARD_EXCEL_COLUMNS.length + activeExcelCustomFields.length} Kolom
              </span>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 text-xs font-mono whitespace-nowrap">
                {STANDARD_EXCEL_COLUMNS.map((col) => (
                  <span
                    key={col.key}
                    className="px-2.5 py-1 rounded bg-white/15 border border-white/20 text-white flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>{col.label}</span>
                  </span>
                ))}

                {activeExcelCustomFields.map((cf) => (
                  <span
                    key={cf.id}
                    className="px-2.5 py-1 rounded bg-emerald-600/60 border border-emerald-400/50 text-emerald-100 font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>{cf.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-300">
              Kolom dengan ikon kunci adalah kolom standar sistem. Kolom hijau dengan ikon bintang adalah kolom kustom yang Anda aktifkan.
            </p>
          </div>

          {/* Matrix of Columns in Excel Template */}
          <SectionCard
            title="Daftar Kolom Template Excel Pendaftaran"
            subtitle="Atur kolom Excel: ubah nama kolom langsung, atur urutan kolom, tentukan wajib/opsional, atau buka pengaturan lengkap bidang."
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleOpenAddModal({ include_in_excel: true, include_in_moodle: false })}
                leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
              >
                Tambah Kolom Excel
              </Button>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {/* Standard Columns */}
              {STANDARD_EXCEL_COLUMNS.map((col) => (
                <div key={col.key} className="py-3 px-3 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{col.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-semibold text-slate-700">
                          Standar Wajib
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{col.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selalu Ada</span>
                  </div>
                </div>
              ))}

              {/* Custom Columns */}
              {fields.map((field, index) => {
                const isEditingLabel = editingLabelFieldId === field.id
                return (
                  <div
                    key={field.id}
                    className={`py-3 px-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      field.include_in_excel ? 'bg-white' : 'bg-slate-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Pindah ke Atas"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === fields.length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Pindah ke Bawah"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          field.include_in_excel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1">
                        {/* Inline Editable Label or Display */}
                        {isEditingLabel ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={inlineLabelValue}
                                onChange={(e) => setInlineLabelValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineLabel(field)
                                  if (e.key === 'Escape') handleCancelEditingLabel()
                                }}
                                autoFocus
                                placeholder="Nama kolom di Excel"
                                className="px-2.5 py-1 text-xs font-bold border-2 border-emerald-500 rounded bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineLabel(field)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                                title="Simpan Nama Kolom"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditingLabel}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {inlineLabelError && (
                              <p className="text-rose-600 text-[11px] font-semibold">{inlineLabelError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{field.label}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditingLabel(field)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Klik untuk ubah nama kolom di Excel"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <code className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                              key: {field.key}
                            </code>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                              {CUSTOM_FIELD_TYPE_OPTIONS.find((t) => t.value === field.field_type)?.label ||
                                field.field_type}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleRequired(field)}
                              className={`text-[10px] px-2 py-0.5 rounded cursor-pointer font-bold transition-all ${
                                field.is_required
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Klik untuk mengubah status Wajib / Opsional"
                            >
                              {field.is_required ? 'Wajib' : 'Opsional'}
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {field.field_type === 'dropdown'
                            ? `Dropdown dengan ${field.options?.length || 0} opsi pilihan`
                            : field.validation_rules?.placeholder || 'Input bebas'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditModal(field)}
                        leftIcon={<Edit2 className="w-3 h-3 mr-1" />}
                        title="Buka modal konfigurasi bidang lengkap"
                      >
                        Edit Bidang
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleToggleIncludeExcel(field)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          field.include_in_excel
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Klik untuk mengubah status di template Excel"
                      >
                        {field.include_in_excel ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>Ada di Excel (ON)</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                            <span>Tidak Ada (OFF)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PENGATURAN KOLOM EKSPOR MOODLE CSV                 */}
      {/* ======================================================== */}
      {activeTab === 'moodle' && (
        <div className="space-y-5">
          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Download className="w-4 h-4" />
                <span>Pratinjau Format Baris Header Berkas CSV Moodle LMS</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                Total {MANDATORY_MOODLE_COLUMNS.length + activeMoodleCustomFields.length} Kolom CSV
              </span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto select-all">
              {[
                ...MANDATORY_MOODLE_COLUMNS.map((m) => m.header),
                ...activeMoodleCustomFields.map((cf) => cf.moodle_destination),
              ].join(',')}
            </div>

            <p className="text-[11px] text-slate-300">
              Format di atas adalah baris pertama berkas CSV resmi yang akan diunggah ke Moodle LMS OGSO (Bulk User Upload).
            </p>
          </div>

          {/* Matrix of Columns in Moodle CSV */}
          <SectionCard
            title="Daftar Kolom Ekspor Berkas CSV Moodle"
            subtitle="Ubah header Moodle langsung, atur urutan ekspor, edit nama bidang, atau tentukan kolom yang disertakan."
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleOpenAddModal({ include_in_excel: true, include_in_moodle: true })}
                leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
              >
                Tambah Kolom Moodle
              </Button>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {/* Mandatory Moodle Columns */}
              {MANDATORY_MOODLE_COLUMNS.map((col) => (
                <div key={col.header} className="py-3 px-3 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-bold text-slate-900 text-xs font-mono">{col.header}</code>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-semibold text-slate-700">
                          Wajib Moodle (7 Kolom)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Sumber data: <strong>{col.source}</strong> — {col.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terkunci</span>
                  </div>
                </div>
              ))}

              {/* Custom Columns mapped to Moodle */}
              {fields.map((field, index) => {
                const isEditingMoodle = editingMoodleFieldId === field.id
                const isEditingLabel = editingLabelFieldId === field.id
                return (
                  <div
                    key={field.id}
                    className={`py-3 px-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      field.include_in_moodle ? 'bg-white' : 'bg-slate-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Pindah ke Atas"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === fields.length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Pindah ke Bawah"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          field.include_in_moodle
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1">
                        {/* Inline Editable Label or Display */}
                        {isEditingLabel ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={inlineLabelValue}
                                onChange={(e) => setInlineLabelValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineLabel(field)
                                  if (e.key === 'Escape') handleCancelEditingLabel()
                                }}
                                autoFocus
                                placeholder="Nama label bidang"
                                className="px-2.5 py-1 text-xs font-bold border-2 border-emerald-500 rounded bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineLabel(field)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                                title="Simpan Nama"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditingLabel}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {inlineLabelError && (
                              <p className="text-rose-600 text-[11px] font-semibold">{inlineLabelError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{field.label}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditingLabel(field)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Klik untuk ubah nama label"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <code className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                              key: {field.key}
                            </code>
                            {field.include_in_moodle && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Header CSV: {field.moodle_destination || `profile_field_${field.key}`}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Inline Destination Editor */}
                        {isEditingMoodle ? (
                          <div className="mt-2 p-3 rounded-lg bg-slate-100 border border-slate-300 space-y-2">
                            <label className="block text-[11px] font-bold text-slate-800">
                              Ubah Header Kolom CSV Moodle:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={inlineMoodleHeader}
                                onChange={(e) => setInlineMoodleHeader(e.target.value.toLowerCase().trim())}
                                placeholder="profile_field_daerah"
                                className="px-3 py-1.5 font-mono text-xs border border-slate-300 rounded bg-white w-64 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSaveInlineMoodleHeader(field)}
                              >
                                Simpan Header
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMoodleFieldId(null)
                                  setInlineMoodleError(null)
                                }}
                              >
                                Batal
                              </Button>
                            </div>
                            {inlineMoodleError && (
                              <p className="text-rose-600 text-[11px] font-semibold">{inlineMoodleError}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                              <span>Pilihan Cepat:</span>
                              <button
                                type="button"
                                onClick={() => setInlineMoodleHeader(`profile_field_${field.key}`)}
                                className="px-1.5 py-0.5 bg-white border rounded font-mono hover:bg-slate-50 cursor-pointer"
                              >
                                profile_field_{field.key}
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineMoodleHeader('idnumber')}
                                className="px-1.5 py-0.5 bg-white border rounded font-mono hover:bg-slate-50 cursor-pointer"
                              >
                                idnumber
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineMoodleHeader('department')}
                                className="px-1.5 py-0.5 bg-white border rounded font-mono hover:bg-slate-50 cursor-pointer"
                              >
                                department
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineMoodleHeader('institution')}
                                className="px-1.5 py-0.5 bg-white border rounded font-mono hover:bg-slate-50 cursor-pointer"
                              >
                                institution
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {field.include_in_moodle
                              ? `Diekspor ke Moodle dengan nama kolom '${field.moodle_destination}'`
                              : 'Tidak diekspor ke Moodle CSV'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {field.include_in_moodle && !isEditingMoodle && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMoodleFieldId(field.id)
                            setInlineMoodleHeader(field.moodle_destination || `profile_field_${field.key}`)
                            setInlineMoodleError(null)
                          }}
                          leftIcon={<Edit2 className="w-3 h-3 mr-1" />}
                        >
                          Ubah Header
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditModal(field)}
                        leftIcon={<Edit2 className="w-3 h-3 mr-1" />}
                        title="Buka modal konfigurasi bidang lengkap"
                      >
                        Edit Bidang
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleToggleIncludeMoodle(field)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          field.include_in_moodle
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Klik untuk mengaktifkan / menonaktifkan ekspor ke Moodle CSV"
                      >
                        {field.include_in_moodle ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>Ekspor Moodle (ON)</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                            <span>Tidak Ekspor (OFF)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MANAJEMEN SEMUA BIDANG PENDAFTARAN                */}
      {/* ======================================================== */}
      {activeTab === 'fields' && (
        <div className="space-y-5">
          {/* Information Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Panduan Fleksibilitas Bidang Pendaftaran:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
              <li>
                <strong>Bebas Nama & Tanpa Batas:</strong> Anda dapat membuat bidang dengan nama apapun
                (misal: <em>Nomor Induk, Daerah / Konsulat, Tempat Lahir, Tanggal Lahir, Nama Pembimbing, Nama Sekolah</em>, dll).
              </li>
              <li>
                <strong>Tipe Bebas (Default):</strong> Tipe standar adalah <strong>Teks Bebas (Free-form input)</strong>. Dropdown hanya aktif jika Anda memilih tipe Dropdown.
              </li>
              <li>
                <strong>Otomatis Terintegrasi:</strong> Setiap bidang aktif akan langsung muncul di template Excel pendaftaran, formulir entri santri, validasi impor, tabel Siswa Saya, dan ekspor Moodle CSV.
              </li>
            </ul>
          </div>

          {/* Custom Fields List */}
          <SectionCard
            title={`Daftar Bidang Pendaftaran Tambahan (${fields.length} Bidang)`}
            subtitle="Urutan tampilan di bawah ini menentukan urutan kolom pada tabel dan template Excel."
          >
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Memuat konfigurasi bidang...</div>
            ) : fields.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm font-medium text-slate-600">Belum ada bidang pendaftaran tambahan.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAddModal}
                  leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
                >
                  Buat Bidang Pertama
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`py-3.5 px-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      field.is_active ? 'hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-60'
                    }`}
                  >
                    {/* Field Info */}
                    <div className="flex items-start gap-3">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100"
                          title="Geser ke Atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === fields.length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100"
                          title="Geser ke Bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{field.label}</span>
                          <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {field.key}
                          </code>

                          {/* Type Badge */}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {CUSTOM_FIELD_TYPE_OPTIONS.find((t) => t.value === field.field_type)?.label ||
                              field.field_type}
                          </span>

                          {/* Required / Optional */}
                          {field.is_required ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Wajib
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Opsional
                            </span>
                          )}

                          {/* Status Aktif */}
                          {field.is_active ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Aktif
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                              Nonaktif
                            </span>
                          )}
                        </div>

                        {/* Metadata Flags */}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                            <span>Template Excel: </span>
                            <strong className={field.include_in_excel ? 'text-emerald-700' : 'text-slate-400'}>
                              {field.include_in_excel ? 'Ya' : 'Tidak'}
                            </strong>
                          </span>

                          <span className="flex items-center gap-1">
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ekspor Moodle: </span>
                            {field.include_in_moodle ? (
                              <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                → {field.moodle_destination}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">Nonaktif</span>
                            )}
                          </span>

                          {field.field_type === 'dropdown' && field.options && field.options.length > 0 && (
                            <span className="text-slate-500">
                              ({field.options.length} opsi pilihan: {field.options.slice(0, 3).join(', ')}
                              {field.options.length > 3 ? '...' : ''})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end md:self-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(field)}
                        title={field.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        {field.is_active ? (
                          <span className="flex items-center gap-1 text-slate-700 text-xs font-semibold">
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(field)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5 mr-1" />}
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingField(field)}
                        title="Hapus bidang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingFieldId ? 'Edit Bidang Pendaftaran' : 'Tambah Bidang Pendaftaran Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="overflow-y-auto p-5 space-y-4 text-xs">
              {modalErrors.global && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalErrors.global}</span>
                </div>
              )}

              {/* Label & Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Nama Bidang / Label <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLabel}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="Contoh: Nomor Induk / Asal Daerah"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  {modalErrors.label && (
                    <p className="text-rose-600 text-[11px]">{modalErrors.label}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Internal Field Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formKey}
                    onChange={(e) => {
                      setIsKeyManuallyEdited(true)
                      setFormKey(e.target.value)
                    }}
                    placeholder="nomor_induk"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50"
                  />
                  <p className="text-[10px] text-slate-500">
                    Format: huruf kecil & garis bawah (snake_case)
                  </p>
                  {modalErrors.key && (
                    <p className="text-rose-600 text-[11px]">{modalErrors.key}</p>
                  )}
                </div>
              </div>

              {/* Input Type Selector */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Tipe Input <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {CUSTOM_FIELD_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        formType === opt.value
                          ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="field_type"
                        value={opt.value}
                        checked={formType === opt.value}
                        onChange={() => setFormType(opt.value)}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{opt.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          {opt.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* If Dropdown, Options Editor */}
              {formType === 'dropdown' && (
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                  <label className="block font-bold text-amber-900">
                    Daftar Opsi Pilihan Dropdown <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-amber-800">
                    Masukkan setiap pilihan dalam baris baru (atau pisahkan dengan tanda koma).
                  </p>
                  <textarea
                    rows={3}
                    value={formDropdownOptions}
                    onChange={(e) => setFormDropdownOptions(e.target.value)}
                    placeholder="Pilihan 1&#10;Pilihan 2&#10;Pilihan 3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                  />
                  {modalErrors.dropdown && (
                    <p className="text-rose-600 text-[11px]">{modalErrors.dropdown}</p>
                  )}
                </div>
              )}

              {/* Configuration Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequired}
                    onChange={(e) => setFormRequired(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Wajib Diisi (Required)</span>
                    <span className="text-[10px] text-slate-500">Santri tidak dapat disimpan jika kosong</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Status Aktif</span>
                    <span className="text-[10px] text-slate-500">Tampilkan di formulir dan template</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIncludeExcel}
                    onChange={(e) => setFormIncludeExcel(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Sertakan di Template Excel</span>
                    <span className="text-[10px] text-slate-500">Menjadi kolom input di berkas Excel</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIncludeMoodle}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setFormIncludeMoodle(checked)
                      if (checked && !formMoodleDest && formKey) {
                        setFormMoodleDest(`profile_field_${formKey}`)
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Ekspor ke Moodle CSV</span>
                    <span className="text-[10px] text-slate-500">Sertakan dalam berkas CSV LMS</span>
                  </div>
                </label>
              </div>

              {/* Moodle CSV Mapping Section */}
              {formIncludeMoodle && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Header Kolom Tujuan CSV Moodle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formMoodleDest}
                    onChange={(e) => setFormMoodleDest(e.target.value.toLowerCase().trim())}
                    placeholder="profile_field_daerah"
                    className="w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  {modalErrors.moodle && (
                    <p className="text-rose-600 text-[11px] font-medium">{modalErrors.moodle}</p>
                  )}

                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p>
                      <strong>Ketentuan Header Moodle:</strong> Format bidang profil kustom Moodle
                      harus <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold">profile_field_&lt;shortname&gt;</code>{' '}
                      (huruf kecil & angka) atau kolom standar Moodle ({STANDARD_MOODLE_FIELDS.join(', ')}).
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span>Pilihan Cepat:</span>
                      <button
                        type="button"
                        onClick={() => setFormMoodleDest(`profile_field_${formKey || 'custom'}`)}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-mono text-[10px] hover:bg-slate-100"
                      >
                        profile_field_{formKey || 'custom'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMoodleDest('idnumber')}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-mono text-[10px] hover:bg-slate-100"
                      >
                        idnumber
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMoodleDest('department')}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-mono text-[10px] hover:bg-slate-100"
                      >
                        department
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder & Helper Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block font-medium text-slate-700">Contoh / Placeholder</label>
                  <input
                    type="text"
                    value={formPlaceholder}
                    onChange={(e) => setFormPlaceholder(e.target.value)}
                    placeholder="misal: Jakarta Selatan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-medium text-slate-700">Petunjuk Pengisian (Helper)</label>
                  <input
                    type="text"
                    value={formHelperText}
                    onChange={(e) => setFormHelperText(e.target.value)}
                    placeholder="misal: Isi sesuai konsulat asal daerah"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingFieldId ? 'Simpan Perubahan' : 'Tambahkan Bidang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Hapus Bidang '{deletingField.label}'?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bidang ini tidak akan lagi muncul di formulir pendaftaran dan template Excel baru.
                  Data santri yang sudah tersimpan sebelumnya tetap aman (preserved) di dalam sistem.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingField(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Hapus Bidang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
