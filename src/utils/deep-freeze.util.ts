// src/utils/deep-freeze.ts

export const deepFreeze = <T>(obj: T): T => {
   Object.freeze(obj)

   Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as any)[prop]
      if (
         value &&
         (typeof value === 'object' || typeof value === 'function') &&
         !Object.isFrozen(value)
      ) {
         deepFreeze(value)
      }
   })

   return obj
}
