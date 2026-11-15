/**
 * Reading time in minutes. Assumes ~220 words per minute for technical prose
 * and adds ~10 seconds for each code block so long walkthroughs aren't
 * under-reported.
 */
export function calculateReadingTime(markdown = "") {
  const codeBlocks = (String(markdown).match(/```/g) || []).length / 2;
  const prose = String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-|]/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  const minutes = words / 220 + Math.ceil(codeBlocks) * 0.15;
  return Math.max(1, Math.round(minutes));
}
