// src/types/api.types.ts

/*────────────────── Base ──────────────────*/
export interface ApiSuccess<T> {
   status: true
   data: T
   message: string
   timestamp: string
   requestId?: string
}

/*────────────────── Pagination ──────────────────*/
export interface PaginationMeta {
   page: number
   limit: number
   total: number
   totalPages: number
   hasNext: boolean
   hasPrev: boolean
}

/*────────────────── Common Payloads ──────────────────*/
export type PaginatedData<T> = {
   items: T[]
   pagination: PaginationMeta
}

export type CreateData<T> = {
   item: T
   created: true
}

export type UpdateData<T> = {
   item: T
   updated: true
   changes?: string[]
}

export type DeleteData = {
   deleted: true
   deletedAt: string
}
