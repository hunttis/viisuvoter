/// <reference types="vite/client" />

// firebase/* subpackages re-export from @firebase/* at runtime.
// These declarations mirror that for TypeScript until the top-level
// firebase package dist dirs are fully present on disk.
declare module 'firebase/app' {
  export * from '@firebase/app'
}
declare module 'firebase/auth' {
  export * from '@firebase/auth'
}
declare module 'firebase/database' {
  export * from '@firebase/database'
}
