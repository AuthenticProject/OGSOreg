/**
 * OGSOreg Operation History & Audit Trail Service
 * Tracks import, export, and synchronization events with campus and jenjang distributions.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase'

export type OperationType =
  | 'import_excel'
  | 'import_csv'
  | 'paste'
  | 'manual_create'
  | 'export_moodle_csv'
  | 'export_admin_excel'
  | 'sync_moodle'

export interface OperationRecord {
  id: string
  institution_id: string
  operation_type: OperationType
  operator_email: string
  student_count: number
  campus_distribution: Record<string, number>
  jenjang_distribution: Record<string, number>
  status: 'success' | 'partial' | 'failed'
  error_count: number
  details?: string
  timestamp: string
}

const LOCAL_STORAGE_KEY = 'ogsoreg_operation_history_v1'

const INITIAL_DEMO_OPERATIONS: OperationRecord[] = [
  {
    id: 'op-init-001',
    institution_id: 'a0000000-0000-0000-0000-000000000001',
    operation_type: 'import_excel',
    operator_email: 'admin.ogso@gontor.ac.id',
    student_count: 3,
    campus_distribution: {
      'Gontor 1': 1,
      'Gontor Putri 1': 1,
      'Gontor 2': 1,
    },
    jenjang_distribution: {
      'Kelas 1': 1,
      'Kelas 2': 1,
      'Kelas 3': 1,
    },
    status: 'success',
    error_count: 0,
    details: 'Impor template Excel batch pendaftaran santri gabungan',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'op-init-002',
    institution_id: 'a0000000-0000-0000-0000-000000000001',
    operation_type: 'export_moodle_csv',
    operator_email: 'admin.ogso@gontor.ac.id',
    student_count: 2,
    campus_distribution: {
      'Gontor 1': 1,
      'Gontor Putri 2': 1,
    },
    jenjang_distribution: {
      'Kelas 1': 1,
      'Kelas 4': 1,
    },
    status: 'success',
    error_count: 0,
    details: 'Ekspor 7 kolom Moodle CSV siap unggah (Upload users)',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

class OperationHistoryService {
  private inMemoryStore: Map<string, OperationRecord[]> = new Map()

  constructor() {
    this.initStorage()
  }

  private initStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, OperationRecord[]>
          Object.entries(parsed).forEach(([instId, ops]) => {
            this.inMemoryStore.set(instId, ops)
          })
        } else {
          this.inMemoryStore.set('a0000000-0000-0000-0000-000000000001', [...INITIAL_DEMO_OPERATIONS])
          this.persist()
        }
      } catch {
        this.inMemoryStore.set('a0000000-0000-0000-0000-000000000001', [...INITIAL_DEMO_OPERATIONS])
      }
    } else {
      this.inMemoryStore.set('a0000000-0000-0000-0000-000000000001', [...INITIAL_DEMO_OPERATIONS])
    }
  }

  private persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const obj: Record<string, OperationRecord[]> = {}
        this.inMemoryStore.forEach((ops, instId) => {
          obj[instId] = ops
        })
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj))
      } catch {
        // Silent ignore
      }
    }
  }

  public async recordOperation(
    op: Omit<OperationRecord, 'id' | 'timestamp'>
  ): Promise<OperationRecord> {
    const record: OperationRecord = {
      ...op,
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('operation_logs').insert({
          institution_id: record.institution_id,
          operation_type: record.operation_type,
          operator_email: record.operator_email,
          student_count: record.student_count,
          campus_distribution: record.campus_distribution,
          jenjang_distribution: record.jenjang_distribution,
          status: record.status,
          error_count: record.error_count,
          details: record.details,
          created_at: record.timestamp,
        })
      } catch {
        // Fall back
      }
    }

    const current = this.inMemoryStore.get(record.institution_id) || []
    const updated = [record, ...current]
    this.inMemoryStore.set(record.institution_id, updated)
    this.persist()

    return record
  }

  public async getOperations(institutionId: string): Promise<OperationRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('operation_logs')
          .select('*')
          .eq('institution_id', institutionId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          return data.map((d) => ({
            id: d.id,
            institution_id: d.institution_id,
            operation_type: d.operation_type as OperationType,
            operator_email: d.operator_email,
            student_count: d.student_count,
            campus_distribution: d.campus_distribution || {},
            jenjang_distribution: d.jenjang_distribution || {},
            status: d.status as 'success' | 'partial' | 'failed',
            error_count: d.error_count,
            details: d.details,
            timestamp: d.created_at,
          }))
        }
      } catch {
        // Fall back
      }
    }

    return this.inMemoryStore.get(institutionId) || []
  }

  public async getLastExportOrSyncTime(institutionId: string): Promise<string | null> {
    const ops = await this.getOperations(institutionId)
    const exportOrSync = ops.find(
      (o) =>
        (o.operation_type === 'export_moodle_csv' ||
          o.operation_type === 'export_admin_excel' ||
          o.operation_type === 'sync_moodle') &&
        o.status === 'success'
    )
    return exportOrSync ? exportOrSync.timestamp : null
  }
}

export const operationHistoryService = new OperationHistoryService()
