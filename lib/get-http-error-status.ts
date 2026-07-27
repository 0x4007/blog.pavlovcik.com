export function getHttpErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined

  const candidate = error as {
    status?: unknown
    statusCode?: unknown
    response?: { status?: unknown }
    cause?: { status?: unknown; statusCode?: unknown }
  }
  const values = [
    candidate.statusCode,
    candidate.status,
    candidate.response?.status,
    candidate.cause?.statusCode,
    candidate.cause?.status
  ]

  return values.find(
    (value): value is number =>
      typeof value === 'number' && Number.isInteger(value)
  )
}
