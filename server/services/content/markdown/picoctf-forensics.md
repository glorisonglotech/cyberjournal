## Executive Summary

Forensics challenges are exercises in ordering. A file arrives with a misleading extension, a payload hidden in metadata, an appended archive, or three layers of encoding. The people who solve them quickly are not guessing — they are running the same triage sequence every time, cheapest check first.

This is that sequence, written as a routine you can reuse.

> [!NOTE]
> Demonstration writeup. The artefacts and flag are redacted; the methodology is the content.

## Introduction

| Item | Value |
| --- | --- |
| Platform | PicoCTF |
| Category | Forensics |
| Difficulty | Easy |
| Artefact | `challenge.jpg` |
| Focus | Metadata, carving, encoding |

## Step 1 — Identify before you analyse

Extensions lie. Ask the operating system what the file contains:

```bash
file challenge.jpg
```

```text
challenge.jpg: JPEG image data, JFIF standard 1.01, resolution (DPI), density 96x96, segment length 16
```

A JPEG that is *also* a zip is common. So is a PNG with a PDF appended. `file` reads the header, which is the only part that cannot lie about what will execute.

```bash
# what is really inside, in order?
binwalk challenge.jpg
```

```text
DECIMAL       HEXADECIMAL     DESCRIPTION
0             0x0             JPEG image data, JFIF standard 1.01
98304         0x18000         Zip archive data, at least v2.0 to extract
98712         0x18198         End of Zip archive
```

Two signatures. The image is a container.

## Step 2 — Metadata first, always

```bash
exiftool challenge.jpg
```

```text
File Name        : challenge.jpg
File Size        : 96 KiB
Image Width      : 800
Image Height     : 600
Comment          : base64: cGljb0NURnt<redacted>==
```

A `Comment` field carrying a base64 string is the whole challenge on the easy tier. Decode it, do not retype it:

```bash
exiftool -s -Comment challenge.jpg | sed 's/^Comment *: *//' | base64 -d
```

```text
picoCTF{<redacted>}
```

> [!TIP]
> `exiftool -a -u -g1` shows duplicate and unknown tags. Hidden text is often stored in a tag the viewer never displays.

## Step 3 — Strings before steganography

Before reaching for stego tooling, read the readable bytes:

```bash
strings -n 8 challenge.jpg | grep -iE "pico|flag|ctf|pass|key"
```

If nothing appears, raise the minimum length or include all encodings:

```bash
strings -a -n 6 challenge.jpg | less
```

`strings` is fast and non-destructive. `steghide` and `zsteg` come after, because they need a passphrase or the right bit plane to produce anything.

## Step 4 — Carve the embedded payload

`binwalk` told us where the archive begins. Extract it without touching the original:

```bash
mkdir carve && binwalk --dd='zip:challenge.zip' challenge.jpg -C carve
cd carve
unzip -o challenge.zip
```

If `binwalk` mislabels an offset, carve by hand. A ZIP signature is `PK\x03\x04`:

```bash
# find every occurrence of the local file header magic
grep -abo $'PK\x03\x04' challenge.jpg
```

```bash
# extract from the reported offset to end of file
dd if=challenge.jpg of=payload.zip bs=1 skip=98304 status=none
unzip -l payload.zip
```

## Step 5 — Decode in the right order

Encoded data usually announces itself. Match the alphabet to the decoder:

| Pattern | Encoding | Command |
| --- | --- | --- |
| `A–Z a–z 0–9 + / =` | Base64 | `base64 -d` |
| `A–Z 2–7` | Base32 | `base32 -d` |
| `0–9 a–f` | Hex | `xxd -r -p` |
| `%41` | URL | `python3 -c 'import urllib.parse,sys;print(urllib.parse.unquote(sys.stdin.read()))'` |
| All printable, shifted | ROT13 | `tr 'A-Za-z' 'N-ZA-Mn-za-m'` |

Chain them only as far as the data requires, verifying each layer rather than piping five tools together and hoping.

```bash
cat payload.txt | base64 -d | xxd -r -p
```

## Step 6 — Steganography when the easy paths fail

If metadata and strings are clean and the file is a lossless image, check LSB data:

```bash
zsteg -a challenge.png | head -40
```

For JPEGs, `steghide` with an empty passphrase is worth one attempt — and if a passphrase is required, it is usually in the challenge description or a companion file:

```bash
steghide extract -sf challenge.jpg -p ""
```

> [!WARNING]
> `steghide` rewrites the file if you run `embed` instead of `extract`. Work on a copy; keep the original hash.

```bash
sha256sum challenge.jpg | tee original.sha256
```

## A triage checklist

```text
1. file            → true type
2. exiftool        → metadata, comments, GPS, author
3. strings         → readable payloads
4. binwalk         → embedded archives, appended data
5. carve + extract → recover the payload
6. decode          → base64 / hex / rot13 / url
7. zsteg / steghide→ LSB and passphrase stego
8. hash + notes    → reproducible evidence
```

## Lessons Learned

- **Order beats tooling.** Cheap checks first; each one either answers the question or narrows it.
- **`file` is authoritative, extensions are not.**
- **Metadata is the most under-checked surface** in forensic challenges and in real incident response.
- **Carve, never modify.** Preserve the original and work on copies.
- **Record hashes** so your findings can be verified later.

## Tools Used

| Tool | Purpose |
| --- | --- |
| file | Type identification |
| exiftool | Metadata extraction |
| strings | Readable-byte extraction |
| binwalk | Signature carving |
| dd | Manual extraction |
| zsteg / steghide | Steganalysis |

## References

- PicoCTF — Forensics category
- exiftool documentation — tag names and `-a -u -g1`
- binwalk — signature scanning and extraction
