/** Detect pasted/dropped intake without separate Facebook/text/screenshot forms. */

export type DetectedIntake = {
  rawText?: string
  sourceUrl?: string
  file?: File
}

function looksLikeUrl(text: string): boolean {
  try {
    const u = new URL(text.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function detectIntake(data: DataTransfer): Promise<DetectedIntake> {
  const file =
    Array.from(data.files).find((f) => f.type.startsWith('image/')) ||
    Array.from(data.items)
      .map((i) => (i.kind === 'file' ? i.getAsFile() : null))
      .find((f): f is File => Boolean(f && f.type.startsWith('image/')))

  const text = data.getData('text/plain')?.trim() || ''
  return detectIntake.fromValues({ text, file: file ?? undefined })
}

detectIntake.fromValues = function fromValues(input: {
  text?: string
  file?: File
}): DetectedIntake {
  const text = input.text?.trim() || undefined
  if (!text) return { file: input.file }
  if (looksLikeUrl(text)) return { sourceUrl: text, file: input.file }
  // text may contain URL + body
  const urlMatch = text.match(/https?:\/\/\S+/)
  if (urlMatch) {
    return {
      sourceUrl: urlMatch[0],
      rawText: text.replace(urlMatch[0], '').trim() || undefined,
      file: input.file,
    }
  }
  return { rawText: text, file: input.file }
}
