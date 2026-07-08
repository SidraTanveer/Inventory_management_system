'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Something went wrong!</h1>
          <p className="mt-2 text-muted-foreground">An error occurred while rendering the page.</p>
          {error.message && (
            <p className="mt-2 text-sm text-red-500">Error: {error.message}</p>
          )}
        </div>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
