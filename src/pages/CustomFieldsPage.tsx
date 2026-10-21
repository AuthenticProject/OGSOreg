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
  RotateCcw,
  GripVertical,
  Save,
  GraduationCap,
  KeyRound,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import { customFieldService } from '../services/customFieldService'
import {
  templateConfigService,
  type ExcelTemplateColumnConfig,
} from '../services/templateConfigService'
import { generateRegistrationTemplate } from '../services/excelGenerator'
import {
  type CustomFieldDefinition,
  type CustomFieldType,
  CUSTOM_FIELD_TYPE_OPTIONS,
  validateMoodleDestinationHeader,
  STANDARD_MOODLE_FIELDS,
} from '../types/customField'
import { STANDARD_FIELD_KEYS } from '../services/validationEngine'

import {
  moodleColumnConfigService,
  type MoodleColumnConfig,
} from '../services/moodle/moodleColumnConfigService'
import {
  getCourseMappingConfig,
  saveCourseMappingConfig,
  resetCourseMappingConfig,
  subscribeCourseMappingConfig,
  generateJenjangShortnamesFromPattern,
  type MoodleCourseMappingConfig,
} from '../services/moodle/moodleCourseMapping'
import type { StudentJenjang } from '../types/student'

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

  // Moodle CSV Column Configuration (Fully editable by Super Admin)
  const [moodleColumns, setMoodleColumns] = useState<MoodleColumnConfig[]>([])
  const [editingMoodleColId, setEditingMoodleColId] = useState<string | null>(null)
  const [inlineMoodleColHeader, setInlineMoodleColHeader] = useState('')
  const [inlineMoodleColError, setInlineMoodleColError] = useState<string | null>(null)

  // Drag & drop state for Moodle columns
  const [draggedMoodleIndex, setDraggedMoodleIndex] = useState<number | null>(null)
  const [dragOverMoodleIndex, setDragOverMoodleIndex] = useState<number | null>(null)

  // Moodle Course Mapping & Value Template Config (Password, Jenjang Output, Course 2)
  const [courseConfig, setCourseConfig] = useState<MoodleCourseMappingConfig>(() =>
    getCourseMappingConfig()
  )

  useEffect(() => {
    const unsubCols = moodleColumnConfigService.subscribe((cols) => {
      setMoodleColumns(cols)
    })
    const unsubMapping = subscribeCourseMappingConfig((cfg) => {
      setCourseConfig(cfg)
    })
    return () => {
      unsubCols()
      unsubMapping()
    }
  }, [])

  const handleSaveCourseConfig = () => {
    saveCourseMappingConfig(courseConfig)
    showFeedback('success', 'Konfigurasi template nilai Moodle (password, output jenjang, dan course 2) berhasil disimpan.')
  }

  const handleResetCourseConfig = () => {
    resetCourseMappingConfig()
    const def = getCourseMappingConfig()
    setCourseConfig(def)
    showFeedback('success', 'Template nilai Moodle dikembalikan ke nilai bawaan resmi.')
  }

  const handleJenjangValueChange = (jenjang: StudentJenjang, val: string) => {
    setCourseConfig((prev) => ({
      ...prev,
      jenjangShortnames: {
        ...prev.jenjangShortnames,
        [jenjang]: val,
      },
    }))
  }

  const handleApplyJenjangPreset = (pattern: string) => {
    const newShortnames = generateJenjangShortnamesFromPattern(pattern)
    setCourseConfig((prev) => ({
      ...prev,
      jenjangShortnames: newShortnames,
    }))
    showFeedback('success', `Format output jenjang diubah menggunakan "${pattern}". Klik "Simpan Template Nilai" untuk menyimpan perubahan.`)
  }

  const handleStartEditMoodleHeader = (col: MoodleColumnConfig) => {
    setEditingMoodleColId(col.id)
    setInlineMoodleColHeader(col.header)
    setInlineMoodleColError(null)
  }

  const handleSaveInlineMoodleHeader = (col: MoodleColumnConfig) => {
    const res = moodleColumnConfigService.updateHeader(col.id, inlineMoodleColHeader)
    if (!res.success) {
      setInlineMoodleColError(res.error || 'Gagal mengubah header.')
      return
    }
    setEditingMoodleColId(null)
    setInlineMoodleColError(null)
    showFeedback('success', `Header kolom Moodle diperbarui menjadi "${inlineMoodleColHeader.trim()}".`)
  }

  const handleToggleIncludeMoodle = (col: MoodleColumnConfig) => {
    moodleColumnConfigService.toggleInclude(col.id)
    showFeedback('success', `Status ekspor kolom '${col.header}' diperbarui.`)
  }

  const handleMoveMoodleOrder = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    moodleColumnConfigService.reorderColumns(index, target)
  }

  const handleResetMoodleToDefault = () => {
    moodleColumnConfigService.resetToDefault()
    showFeedback('success', 'Susunan dan nama header kolom Moodle CSV dikembalikan ke bawaan resmi.')
  }

  const handleMoodleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMoodleIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleMoodleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverMoodleIndex !== index) {
      setDragOverMoodleIndex(index)
    }
  }

  const handleMoodleDragEnd = () => {
    setDraggedMoodleIndex(null)
    setDragOverMoodleIndex(null)
  }

  const handleMoodleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedMoodleIndex === null || draggedMoodleIndex === targetIndex) {
      handleMoodleDragEnd()
      return
    }
    moodleColumnConfigService.reorderColumns(draggedMoodleIndex, targetIndex)
    handleMoodleDragEnd()
    showFeedback('success', 'Urutan kolom Moodle CSV berhasil diperbarui.')
  }

  // Unified Excel Template Columns (Standard + Custom)
  const [templateColumns, setTemplateColumns] = useState<ExcelTemplateColumnConfig[]>(() =>
    templateConfigService.getColumns()
  )
  const [editingTemplateColId, setEditingTemplateColId] = useState<string | null>(null)
  const [inlineTemplateColLabel, setInlineTemplateColLabel] = useState('')
  const [inlineTemplateColError, setInlineTemplateColError] = useState<string | null>(null)

  const handleStartEditingTemplateCol = (col: ExcelTemplateColumnConfig) => {
    setEditingTemplateColId(col.id)
    setInlineTemplateColLabel(col.label)
    setInlineTemplateColError(null)
  }

  const handleCancelEditingTemplateCol = () => {
    setEditingTemplateColId(null)
    setInlineTemplateColLabel('')
    setInlineTemplateColError(null)
  }

  const handleSaveTemplateColLabel = async (col: ExcelTemplateColumnConfig) => {
    const trimmed = inlineTemplateColLabel.trim()
    if (!trimmed) {
      setInlineTemplateColError('Nama kolom tidak boleh kosong.')
      return
    }

    await templateConfigService.updateColumn(col.id, { label: trimmed })
    setEditingTemplateColId(null)
    setInlineTemplateColError(null)
    showFeedback('success', `Nama kolom diperbarui menjadi "${trimmed}".`)
  }

  const handleToggleTemplateInclude = async (col: ExcelTemplateColumnConfig) => {
    const nextVal = !col.include_in_excel
    await templateConfigService.updateColumn(col.id, { include_in_excel: nextVal })
    showFeedback(
      'success',
      `Kolom '${col.label}' ${nextVal ? 'disertakan dalam' : 'dikeluarkan dari'} template Excel.`
    )
  }

  const handleToggleTemplateRequired = async (col: ExcelTemplateColumnConfig) => {
    const nextVal = !col.is_required
    await templateConfigService.updateColumn(col.id, { is_required: nextVal })
    showFeedback(
      'success',
      `Status kolom '${col.label}' diubah menjadi ${nextVal ? 'Wajib' : 'Opsional'}.`
    )
  }

  const handleMoveTemplateOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= templateColumns.length) return

    const newCols = [...templateColumns]
    const temp = newCols[index]
    newCols[index] = newCols[targetIndex]
    newCols[targetIndex] = temp

    const idsInOrder = newCols.map((c) => c.id)
    await templateConfigService.reorderColumns(idsInOrder)
    showFeedback('success', 'Urutan posisi kolom template Excel berhasil diperbarui.')
  }

  const handleResetTemplateToDefault = () => {
    templateConfigService.resetToDefault()
    showFeedback('success', 'Nama dan urutan kolom standar template Excel dikembalikan ke bawaan.')
  }

  // Drag & Drop State for Tab 1 (Template Columns)
  const [draggedTemplateIndex, setDraggedTemplateIndex] = useState<number | null>(null)
  const [dragOverTemplateIndex, setDragOverTemplateIndex] = useState<number | null>(null)

  const handleTemplateDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTemplateIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleTemplateDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTemplateIndex !== index) {
      setDragOverTemplateIndex(index)
    }
  }

  const handleTemplateDragEnd = () => {
    setDraggedTemplateIndex(null)
    setDragOverTemplateIndex(null)
  }

  const handleTemplateDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedTemplateIndex === null || draggedTemplateIndex === targetIndex) {
      handleTemplateDragEnd()
      return
    }

    const newCols = [...templateColumns]
    const [draggedItem] = newCols.splice(draggedTemplateIndex, 1)
    newCols.splice(targetIndex, 0, draggedItem)

    setTemplateColumns(newCols)
    handleTemplateDragEnd()

    const idsInOrder = newCols.map((c) => c.id)
    await templateConfigService.reorderColumns(idsInOrder)
    showFeedback('success', `Kolom '${draggedItem.label}' dipindahkan ke posisi ${targetIndex + 1}.`)
  }

  // Drag & Drop State for Tab 2 & Tab 3 (Fields)
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null)
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null)

  const handleFieldDragStart = (e: React.DragEvent, index: number) => {
    setDraggedFieldIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleFieldDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverFieldIndex !== index) {
      setDragOverFieldIndex(index)
    }
  }

  const handleFieldDragEnd = () => {
    setDraggedFieldIndex(null)
    setDragOverFieldIndex(null)
  }

  const handleFieldDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedFieldIndex === null || draggedFieldIndex === targetIndex) {
      handleFieldDragEnd()
      return
    }

    const newFields = [...fields]
    const [draggedItem] = newFields.splice(draggedFieldIndex, 1)
    newFields.splice(targetIndex, 0, draggedItem)

    setFields(newFields)
    handleFieldDragEnd()

    const idsInOrder = newFields.map((f) => f.id)
    await customFieldService.reorderCustomFields(idsInOrder)
    showFeedback('success', `Bidang '${draggedItem.label}' dipindahkan ke posisi ${targetIndex + 1}.`)
  }

  // Subscribe to templateConfigService
  useEffect(() => {
    const unsubscribe = templateConfigService.subscribe((updated) => {
      setTemplateColumns(updated)
    })
    return () => unsubscribe()
  }, [])

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
    } else if (STANDARD_FIELD_KEYS.includes(cleanKey)) {
      errors.key = `Key '${cleanKey}' adalah nama kolom bawaan sistem dan tidak boleh digunakan sebagai custom field.`
    }

    if (STANDARD_FIELD_KEYS.includes(formLabel.trim().toLowerCase())) {
      errors.label = `Label '${formLabel.trim()}' adalah kolom bawaan sistem dan tidak boleh digunakan sebagai custom field.`
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

  // Active template columns in Excel (both standard and custom fields)
  const activeTemplateColumns = templateColumns.filter((col) => col.include_in_excel)
  // Active columns in Moodle CSV (both standard and custom fields, fully editable)
  const activeMoodleColumns = moodleColumns.filter((col) => col.include_in_moodle)

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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all cursor-pointer ${
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
            {activeTemplateColumns.length} Kolom
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('moodle')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all cursor-pointer ${
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
            {activeMoodleColumns.length} Kolom
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all cursor-pointer ${
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
                <span>Pratinjau Susunan Header Template Excel (Baris 1 Format Pendaftaran)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                Total {activeTemplateColumns.length} Kolom
              </span>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 text-xs font-mono whitespace-nowrap">
                {activeTemplateColumns.map((col, idx) => (
                  <span
                    key={col.id}
                    className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                      col.is_standard
                        ? 'bg-white/15 border-white/20 text-white'
                        : 'bg-emerald-600/60 border-emerald-400/50 text-emerald-100 font-bold'
                    }`}
                  >
                    <span className="opacity-60 text-[10px]">[{idx + 1}]</span>
                    {col.is_standard ? (
                      <Lock className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                    )}
                    <span>{col.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-300">
              Kolom dengan ikon kunci adalah kolom standar sistem (dapat diubah nama & posisinya). Kolom hijau dengan bintang adalah bidang kustom. Urutan nomor [1, 2, ...] adalah posisi kolom persis di berkas Excel santri.
            </p>
          </div>

          {/* Matrix of Columns in Excel Template */}
          <SectionCard
            title="Daftar Kolom Template Excel Pendaftaran"
            subtitle="Atur seluruh kolom Excel (bawaan & kustom): seret dengan mouse (drag & drop) atau gunakan panah untuk ubah urutan, ubah nama kolom langsung, tentukan wajib/opsional, atau nonaktifkan."
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetTemplateToDefault}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
                  title="Kembalikan nama dan urutan kolom standar ke bawaan"
                >
                  Reset ke Bawaan
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenAddModal({ include_in_excel: true, include_in_moodle: false })}
                  leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
                >
                  Tambah Kolom Excel
                </Button>
              </div>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {templateColumns.map((col, index) => {
                const isEditingLabel = editingTemplateColId === col.id
                const isDragging = draggedTemplateIndex === index
                const isOver = dragOverTemplateIndex === index && draggedTemplateIndex !== index
                return (
                  <div
                    key={col.id}
                    draggable={!isEditingLabel}
                    onDragStart={(e) => handleTemplateDragStart(e, index)}
                    onDragOver={(e) => handleTemplateDragOver(e, index)}
                    onDragEnd={handleTemplateDragEnd}
                    onDrop={(e) => handleTemplateDrop(e, index)}
                    className={`py-3 px-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-150 ${
                      isDragging
                        ? 'opacity-40 scale-[0.99] border-2 border-dashed border-emerald-400 bg-emerald-50/40 rounded-lg'
                        : isOver
                        ? 'border-t-2 border-emerald-600 bg-emerald-50/70'
                        : col.include_in_excel
                        ? 'bg-white'
                        : 'bg-slate-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Drag Handle & Reorder Buttons */}
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <div
                          className="p-1 text-slate-400 hover:text-emerald-700 rounded cursor-grab active:cursor-grabbing shrink-0 select-none"
                          title="Seret dengan mouse untuk ubah posisi urutan kolom"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveTemplateOrder(index, 'up')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Pindah Posisi ke Atas"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === templateColumns.length - 1}
                            onClick={() => handleMoveTemplateOrder(index, 'down')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Pindah Posisi ke Bawah"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          col.is_standard
                            ? 'bg-blue-100 text-blue-700'
                            : col.include_in_excel
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {col.is_standard ? <Lock className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1">
                        {/* Inline Editable Label or Display */}
                        {isEditingLabel ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={inlineTemplateColLabel}
                                onChange={(e) => setInlineTemplateColLabel(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTemplateColLabel(col)
                                  if (e.key === 'Escape') handleCancelEditingTemplateCol()
                                }}
                                autoFocus
                                placeholder="Nama kolom di Excel"
                                className="px-2.5 py-1 text-xs font-bold border-2 border-emerald-500 rounded bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTemplateColLabel(col)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                                title="Simpan Nama Kolom"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditingTemplateCol}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {inlineTemplateColError && (
                              <p className="text-rose-600 text-[11px] font-semibold">{inlineTemplateColError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{col.label}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditingTemplateCol(col)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Klik untuk ubah nama header kolom ini di template Excel"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <code className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                              key: {col.key}
                            </code>

                            {col.is_standard ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                Standar Sistem
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                Bidang Kustom
                              </span>
                            )}

                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                              {CUSTOM_FIELD_TYPE_OPTIONS.find((t) => t.value === col.field_type)?.label || col.field_type}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleTemplateRequired(col)}
                              className={`text-[10px] px-2 py-0.5 rounded cursor-pointer font-bold transition-all ${
                                col.is_required
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Klik untuk mengubah status Wajib / Opsional"
                            >
                              {col.is_required ? 'Wajib' : 'Opsional'}
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500 mt-0.5">{col.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {!col.is_standard && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const targetCf = fields.find((f) => f.id === col.id)
                            if (targetCf) handleOpenEditModal(targetCf)
                          }}
                          leftIcon={<Edit2 className="w-3 h-3 mr-1" />}
                          title="Buka modal konfigurasi bidang lengkap"
                        >
                          Edit Bidang
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleTemplateInclude(col)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          col.include_in_excel
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Klik untuk menyertakan / mengeluarkan dari template Excel"
                      >
                        {col.include_in_excel ? (
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
                <span>Pratinjau Format Baris Header Berkas CSV Moodle LMS (Editable)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                Total {activeMoodleColumns.length} Kolom Aktif
              </span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto select-all">
              {activeMoodleColumns.map((c) => c.header).join(',')}
            </div>

            <p className="text-[11px] text-slate-300">
              Format di atas adalah baris header berkas CSV resmi yang akan diunggah ke Moodle LMS OGSO (Bulk User Upload). Seluruh header kolom, urutan, keaktifannya, serta nilai bawaan isinya (password, output jenjang, dan course 2) dapat Anda sesuaikan secara bebas di bawah ini.
            </p>
          </div>

          {/* Section: Konfigurasi Nilai Template Isi CSV Moodle */}
          <SectionCard
            title="Konfigurasi Nilai Bawaan / Template Isi CSV Moodle"
            subtitle="Sesuaikan nilai default yang akan diisikan ke kolom berkas CSV Moodle: Password awal santri, format penamaan output Jenjang (course1), dan nama kursus kedua (course2)."
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetCourseConfig}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
                  title="Kembalikan nilai template ke default pabrik"
                >
                  Reset Template
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveCourseConfig}
                  leftIcon={<Save className="w-3.5 h-3.5 mr-1" />}
                >
                  Simpan Template Nilai
                </Button>
              </div>
            }
          >
            <div className="space-y-5 text-xs p-1">
              {/* 1. Password Awal Santri */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-maroon" />
                    <span className="font-bold text-slate-800 text-xs">
                      1. Password Awal Santri (Template Default Password)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-brand-maroon bg-brand-maroon/10 px-2.5 py-0.5 rounded-full font-bold">
                    Kolom: password
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Password ini akan otomatis diisikan pada kolom <code>password</code> di setiap baris santri saat ekspor berkas CSV Moodle. Anda dapat mengubahnya ke pola apa pun yang diinginkan (misal: <code>ogso_2026!</code>, <code>Santri2026*</code>, <code>Gontor#123</code>).
                </p>
                <div className="flex items-center gap-2.5 max-w-md">
                  <input
                    type="text"
                    value={courseConfig.defaultPassword || ''}
                    onChange={(e) => setCourseConfig({ ...courseConfig, defaultPassword: e.target.value })}
                    placeholder="ogso_2026!"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-maroon"
                  />
                  <button
                    type="button"
                    onClick={() => setCourseConfig({ ...courseConfig, defaultPassword: 'ogso_2026!' })}
                    className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap cursor-pointer"
                    title="Gunakan default ogso_2026!"
                  >
                    ogso_2026!
                  </button>
                </div>
              </div>

              {/* 2. Format Output Jenjang (course1) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-slate-800 text-xs">
                      2. Format Nilai Output Jenjang (Course 1)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                    Kolom: course1
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tentukan teks yang akan dihasilkan pada kolom <code>course1</code> untuk tiap jenjang santri. Anda bisa memilih preset cepat di bawah atau mengetik nilai kustom bebas (misal: <code>JENJANG 1</code>, <code>JENJANG</code>, atau kode kursus resmi LMS).
                </p>

                {/* Preset Cepat */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-600 font-semibold">Terapkan Format Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyJenjangPreset('JENJANG')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer"
                    title="Ubah nilai output jadi 'JENJANG 1', 'JENJANG 2', dst."
                  >
                    JENJANG 1..5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyJenjangPreset('JENJANG_{n}')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                    title="Ubah nilai output jadi 'JENJANG_1', 'JENJANG_2', dst."
                  >
                    JENJANG_1..5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyJenjangPreset('ogso_j{n}')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                    title="Kembalikan format bawaan 'ogso_j1', 'ogso_j2', dst."
                  >
                    ogso_j1..j5
                  </button>
                </div>

                {/* Individual per-jenjang inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                  {(['Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5'] as StudentJenjang[]).map((cls) => (
                    <div key={cls} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                      <label className="block font-bold text-slate-700 text-[11px]">
                        {cls}
                      </label>
                      <input
                        type="text"
                        value={courseConfig.jenjangShortnames[cls] || ''}
                        onChange={(e) => handleJenjangValueChange(cls, e.target.value)}
                        placeholder={`misal: JENJANG ${cls.slice(-1)}`}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Nilai Bawaan Course 2 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-slate-800 text-xs">
                      3. Nilai Bawaan Kolom Course 2 (Simulasi / Sesi)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                    Kolom: course2
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tentukan teks yang diisikan ke kolom <code>course2</code> untuk seluruh santri (misal: <code>simulation</code>, <code>simulasi_2026</code>, <code>sesi_1</code>, dll).
                </p>
                <div className="flex items-center gap-2.5 max-w-md">
                  <input
                    type="text"
                    value={courseConfig.simulationShortname}
                    onChange={(e) => setCourseConfig({ ...courseConfig, simulationShortname: e.target.value })}
                    placeholder="simulation"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setCourseConfig({ ...courseConfig, simulationShortname: 'simulation' })}
                    className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap cursor-pointer"
                  >
                    simulation
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseConfig({ ...courseConfig, simulationShortname: 'simulasi_2026' })}
                    className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap cursor-pointer"
                  >
                    simulasi_2026
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Matrix of Columns in Moodle CSV */}
          <SectionCard
            title="Daftar Kolom Ekspor Berkas CSV Moodle"
            subtitle="Atur seluruh kolom Moodle (kolom standar & bidang kustom): ubah nama header CSV secara langsung, seret baris dengan mouse (drag & drop) atau gunakan panah untuk atur urutan ekspor, atau aktifkan/nonaktifkan kolom."
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetMoodleToDefault}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
                  title="Kembalikan nama header dan urutan kolom standar Moodle ke bawaan resmi"
                >
                  Reset ke Bawaan
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenAddModal({ include_in_excel: true, include_in_moodle: true })}
                  leftIcon={<Plus className="w-3.5 h-3.5 mr-1" />}
                >
                  Tambah Kolom Moodle
                </Button>
              </div>
            }
          >
            <div className="divide-y divide-slate-100 text-xs">
              {moodleColumns.map((col, index) => {
                const isEditingHeader = editingMoodleColId === col.id
                const isDragging = draggedMoodleIndex === index
                const isOver = dragOverMoodleIndex === index && draggedMoodleIndex !== index

                return (
                  <div
                    key={col.id}
                    draggable={!isEditingHeader}
                    onDragStart={(e) => handleMoodleDragStart(e, index)}
                    onDragOver={(e) => handleMoodleDragOver(e, index)}
                    onDragEnd={handleMoodleDragEnd}
                    onDrop={(e) => handleMoodleDrop(e, index)}
                    className={`py-3 px-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-150 ${
                      isDragging
                        ? 'opacity-40 scale-[0.99] border-2 border-dashed border-emerald-400 bg-emerald-50/40 rounded-lg'
                        : isOver
                        ? 'border-t-2 border-emerald-600 bg-emerald-50/70'
                        : col.include_in_moodle
                        ? 'bg-white'
                        : 'bg-slate-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Drag Handle & Reorder Buttons */}
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <div
                          className="p-1 text-slate-400 hover:text-emerald-700 rounded cursor-grab active:cursor-grabbing shrink-0 select-none"
                          title="Seret dengan mouse untuk ubah posisi urutan kolom"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveMoodleOrder(index, 'up')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === moodleColumns.length - 1}
                            onClick={() => handleMoveMoodleOrder(index, 'down')}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          col.is_standard
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {col.is_standard ? (
                          <Download className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="flex-1">
                        {isEditingHeader ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={inlineMoodleColHeader}
                                onChange={(e) => setInlineMoodleColHeader(e.target.value.toLowerCase().trim())}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineMoodleHeader(col)
                                  if (e.key === 'Escape') {
                                    setEditingMoodleColId(null)
                                    setInlineMoodleColError(null)
                                  }
                                }}
                                autoFocus
                                placeholder="Nama header CSV Moodle"
                                className="px-2.5 py-1 text-xs font-mono font-bold border-2 border-emerald-500 rounded bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineMoodleHeader(col)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                                title="Simpan Header"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMoodleColId(null)
                                  setInlineMoodleColError(null)
                                }}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {inlineMoodleColError && (
                              <p className="text-rose-600 text-[11px] font-semibold">{inlineMoodleColError}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{col.sourceLabel}</span>
                              <code className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Header CSV: {col.header}
                              </code>
                              <code className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                                key: {col.key}
                              </code>
                              {col.is_standard ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                  Standar Moodle (Editable)
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                                  Bidang Kustom
                                </span>
                              )}
                              {!col.include_in_moodle && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                  Dinonaktifkan
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {col.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {!isEditingHeader && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEditMoodleHeader(col)}
                          leftIcon={<Edit2 className="w-3 h-3 mr-1" />}
                          title="Ubah nama header CSV Moodle"
                        >
                          Ubah Header
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleIncludeMoodle(col)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          col.include_in_moodle
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Klik untuk mengaktifkan / menonaktifkan ekspor kolom ini ke Moodle CSV"
                      >
                        {col.include_in_moodle ? (
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
            subtitle="Urutan tampilan di bawah ini menentukan urutan kolom pada tabel dan template Excel. Seret baris dengan mouse (drag & drop) atau gunakan panah untuk ubah urutan."
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
                {fields.map((field, index) => {
                  const isDragging = draggedFieldIndex === index
                  const isOver = dragOverFieldIndex === index && draggedFieldIndex !== index
                  return (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={(e) => handleFieldDragStart(e, index)}
                      onDragOver={(e) => handleFieldDragOver(e, index)}
                      onDragEnd={handleFieldDragEnd}
                      onDrop={(e) => handleFieldDrop(e, index)}
                      className={`py-3.5 px-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-150 ${
                        isDragging
                          ? 'opacity-40 scale-[0.99] border-2 border-dashed border-emerald-400 bg-emerald-50/40'
                          : isOver
                          ? 'border-t-2 border-emerald-600 bg-emerald-50/70'
                          : field.is_active
                          ? 'hover:bg-slate-50/70'
                          : 'bg-slate-50/50 opacity-60'
                      }`}
                    >
                      {/* Field Info */}
                      <div className="flex items-start gap-3">
                        {/* Drag Handle & Reorder Buttons */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <div
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded cursor-grab active:cursor-grabbing shrink-0 select-none"
                            title="Seret dengan mouse untuk ubah posisi urutan bidang"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, 'up')}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
                              title="Geser ke Atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === fields.length - 1}
                              onClick={() => handleMoveOrder(index, 'down')}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
                              title="Geser ke Bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                )
              })}
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
