export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

export function createTimestampedFilename(file: File): string {
  const timestamp = new Date().toISOString().replaceAll(":", "-")
  return `${file.name.substring(0, file.name.lastIndexOf("."))}-${timestamp}.csv`
}
