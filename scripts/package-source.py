"""Create a reproducible, source-only Android distribution from this checkout."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'Farbound-Android-Source.zip'
files = [ROOT / 'README.md']
for folder in ('dist', 'android', 'tests', 'releases', 'scripts', 'docs'):
    files += [p for p in (ROOT / folder).rglob('*') if p.is_file()
              and p != OUT and '.gradle' not in p.parts and 'build' not in p.parts
              and '__pycache__' not in p.parts]
with ZipFile(OUT, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for p in sorted(files):
        info = ZipInfo('Farbound/' + p.relative_to(ROOT).as_posix(), (2026, 9, 7, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, p.read_bytes())
with ZipFile(OUT) as archive:
    assert archive.testzip() is None
    assert 'Farbound/dist/frontier.mjs' in archive.namelist()
    assert 'Farbound/dist/classic/core.mjs' in archive.namelist()
    assert 'Farbound/android/app/src/main/java/com/farbound/game/MainActivity.java' in archive.namelist()
print(f'Packaged {len(files)} files; {OUT.stat().st_size:,} bytes; archive verified.')
