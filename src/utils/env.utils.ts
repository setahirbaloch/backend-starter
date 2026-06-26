// src/utils/env.utils.ts
/** biome-ignore-all lint/style/noNonNullAssertion: fallback can be undefined */

/* ────────────── Local Types (colocated) ────────────── */

type ParseStringOptions = {
   key: string
   fallback?: string
}

type ParseNumberOptions = {
   key: string
   fallback?: number
}

type ParseBooleanOptions = {
   key: string
   fallback?: boolean
}

type ParseListOptions = {
   key: string
   fallback?: string[]
   delimiter?: string
}

type ParseEnumOptions<T extends readonly string[]> = {
   key: string
   values: T
   fallback?: T[number]
}

/* ────────────── Internal Helpers ────────────── */

const getEnv = (key: string): string | undefined => process.env[key]

/* ────────────── Parsers ────────────── */

export const parseString = ({ key, fallback }: ParseStringOptions): string => {
   const value = getEnv(key)
   if (!value && fallback === undefined) {
      throw new Error(`ENV ${key} is required`)
   }
   return value ?? fallback!
}

export const parseNumber = ({ key, fallback }: ParseNumberOptions): number => {
   const value = getEnv(key)
   const parsed = Number(value)

   if (
      (value === undefined || Number.isNaN(parsed)) &&
      fallback === undefined
   ) {
      throw new Error(`ENV ${key} must be a valid number`)
   }

   return value ? parsed : fallback!
}

export const parseBoolean = ({
   key,
   fallback,
}: ParseBooleanOptions): boolean => {
   const value = getEnv(key)

   if (!value && fallback === undefined) {
      throw new Error(`ENV ${key} must be boolean`)
   }

   if (!value) return fallback!

   return ['true', '1', 'yes'].includes(value.toLowerCase())
}

export const parseList = ({
   key,
   fallback,
   delimiter = ',',
}: ParseListOptions): string[] => {
   const value = getEnv(key)

   if (!value && fallback === undefined) {
      throw new Error(`ENV ${key} must be a list`)
   }

   return value ? value.split(delimiter).map((v) => v.trim()) : fallback!
}

export const parseEnum = <T extends readonly string[]>({
   key,
   values,
   fallback,
}: ParseEnumOptions<T>): T[number] => {
   const value = getEnv(key)

   if (!value && fallback !== undefined) return fallback

   if (!value || !values.includes(value)) {
      throw new Error(`ENV ${key} must be one of [${values.join(', ')}]`)
   }

   return value as T[number]
}
