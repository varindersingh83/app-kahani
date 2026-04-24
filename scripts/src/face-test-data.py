#!/usr/bin/env python3
"""Slice a 3-section face contact sheet into test assets.

This script expects the same layout as the image you shared:

* 3 sections stacked vertically: men, women, kids
* 3 portrait rows per section
* 5 portrait columns per row

It writes 45 cropped portraits, grouped by category, plus JSON manifests that
can be used to build deterministic role combinations for tests.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image


SECTION_NAMES = ("men", "women", "kids")


@dataclass(frozen=True)
class Band:
    start: int
    end: int

    @property
    def height(self) -> int:
        return self.end - self.start + 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Slice a face contact sheet into reusable test data.")
    parser.add_argument("input", type=Path, help="Source sheet image.")
    parser.add_argument(
        "output_dir",
        type=Path,
        nargs="?",
        default=None,
        help="Output directory. Defaults to ./artifacts/face-test-data/<source-stem>.",
    )
    parser.add_argument("--cell-inset", type=int, default=8, help="Pixels to trim from each portrait tile edge.")
    parser.add_argument("--seed", type=int, default=7, help="Seed used when building role-combination samples.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.input.exists():
        raise SystemExit(f"Input file not found: {args.input}")
    if args.cell_inset < 0:
        raise SystemExit("--cell-inset must be zero or positive")

    output_dir = args.output_dir or default_output_dir(args.input)
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(args.input) as source:
        image = source.convert("RGB")
        row_bands = detect_row_bands(image)
        sections = group_sections(row_bands)
        if len(sections) != 3:
            raise SystemExit(
                f"Expected 3 sections in the contact sheet, found {len(sections)}. "
                "This script is tuned for the DADS / MOMS / KIDS layout."
            )

        manifest: dict[str, object] = {
            "source": str(args.input.resolve()),
            "outputDir": str(output_dir.resolve()),
            "seed": args.seed,
            "categories": {},
        }

        category_files: dict[str, list[str]] = {}

        for section_name, section in zip(SECTION_NAMES, sections, strict=True):
            face_rows = section[1:]
            category_dir = output_dir / section_name
            category_dir.mkdir(parents=True, exist_ok=True)

            category_entries = []
            written_files: list[str] = []
            for row_index, band in enumerate(face_rows, start=1):
                content_columns = detect_content_columns(image, band)
                if len(content_columns) != 5:
                    raise SystemExit(
                        f"Expected 5 portrait columns in {section_name} row {row_index}, found {len(content_columns)}."
                    )

                for col_index, column in enumerate(content_columns, start=1):
                    crop = crop_tile(image, band, column, args.cell_inset)
                    file_name = f"{section_name}-{len(category_entries) + 1:02d}.png"
                    out_path = category_dir / file_name
                    crop.save(out_path)
                    rel_path = str(out_path.relative_to(output_dir))

                    category_entries.append(
                        {
                            "index": len(category_entries) + 1,
                            "row": row_index,
                            "col": col_index,
                            "file": rel_path,
                            "crop": {
                                "left": column[0],
                                "top": band.start,
                                "right": column[1],
                                "bottom": band.end,
                            },
                        }
                    )
                    written_files.append(rel_path)

            manifest["categories"][section_name] = category_entries  # type: ignore[index]
            category_files[section_name] = written_files

        role_combinations = build_role_combinations(category_files)
        role_manifest = {
            "source": str(args.input.resolve()),
            "seed": args.seed,
            "roleCombinations": role_combinations,
            "defaultRolePick": {
                "dad": role_combinations[0]["dad"],
                "mom": role_combinations[0]["mom"],
                "kid": role_combinations[0]["kid"],
                "sibling": role_combinations[0]["sibling"],
                "friend": role_combinations[0]["friend"],
            },
        }

    write_json(output_dir / "manifest.json", manifest)
    write_json(output_dir / "role-combinations.json", role_manifest)

    print(f"Sliced {args.input} -> {output_dir}")
    for section_name in SECTION_NAMES:
        print(f"- {section_name}: {len(category_files[section_name])} portraits")
    print(f"Manifest: {output_dir / 'manifest.json'}")
    print(f"Role combinations: {output_dir / 'role-combinations.json'}")
    return 0


def default_output_dir(input_path: Path) -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    slug = safe_stem(input_path.stem)
    return repo_root / "artifacts" / "face-test-data" / slug


def safe_stem(value: str) -> str:
    return "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in value).strip("-") or "faces"


def detect_row_bands(image: Image.Image) -> list[Band]:
    width, height = image.size
    bands: list[Band] = []
    active_start: int | None = None

    for y in range(height):
        dark_count = 0
        for x in range(width):
            if not is_white(image.getpixel((x, y))):
                dark_count += 1

        if dark_count > max(16, width // 30):
            if active_start is None:
                active_start = y
        elif active_start is not None:
            bands.append(Band(active_start, y - 1))
            active_start = None

    if active_start is not None:
        bands.append(Band(active_start, height - 1))

    if len(bands) != 12:
        raise SystemExit(f"Expected 12 visible row bands, found {len(bands)}.")

    return bands


def group_sections(row_bands: list[Band]) -> list[list[Band]]:
    sections = [row_bands[index : index + 4] for index in range(0, len(row_bands), 4)]
    if any(len(section) != 4 for section in sections):
        raise SystemExit("Unexpected row-band layout; the sheet is not divisible into 3 sections of 4 bands each.")

    title_heights = [section[0].height for section in sections]
    face_heights = [band.height for section in sections for band in section[1:]]
    if not all(height <= 40 for height in title_heights):
        raise SystemExit("Expected each section to start with a short title band.")
    if not all(height >= 100 for height in face_heights):
        raise SystemExit("Expected each portrait band to be tall enough to contain face tiles.")

    return sections


def detect_content_columns(image: Image.Image, band: Band) -> list[tuple[int, int]]:
    width, _ = image.size
    white_columns: list[Band] = []
    active_start: int | None = None

    for x in range(width):
        is_column_white = all(is_white(image.getpixel((x, y))) for y in range(band.start, band.end + 1))
        if is_column_white:
            if active_start is None:
                active_start = x
        elif active_start is not None:
            white_columns.append(Band(active_start, x - 1))
            active_start = None

    if active_start is not None:
        white_columns.append(Band(active_start, width - 1))

    white_columns = merge_close_bands(white_columns, max_gap=2)

    if len(white_columns) < 6:
        raise SystemExit(
            f"Could not find the full set of gutters in band {band.start}-{band.end}. "
            "The image may not use the expected 5-column layout."
        )

    # Keep the first and last white columns as the outer padding; the rest are gutters.
    content_columns: list[tuple[int, int]] = []
    left = white_columns[0].end + 1
    for gutter in white_columns[1:-1]:
        right = gutter.start - 1
        if right >= left:
            content_columns.append((left, right))
        left = gutter.end + 1

    final_right = white_columns[-1].start - 1
    if final_right >= left:
        content_columns.append((left, final_right))

    return content_columns


def crop_tile(image: Image.Image, band: Band, column: tuple[int, int], inset: int) -> Image.Image:
    left = column[0] + inset
    top = band.start + inset
    right = column[1] - inset + 1
    bottom = band.end - inset + 1

    if right <= left:
        raise SystemExit("Computed an empty horizontal crop. Try lowering --cell-inset.")
    if bottom <= top:
        raise SystemExit("Computed an empty vertical crop. Try lowering --cell-inset.")

    return image.crop((left, top, right, bottom))


def build_role_combinations(category_files: dict[str, list[str]]) -> list[dict[str, str]]:
    men = category_files["men"]
    women = category_files["women"]
    kids = category_files["kids"]
    combo_count = min(len(men), len(women), len(kids))

    if combo_count < 3:
        raise SystemExit("Need at least 3 portraits per category to build role combinations.")

    combinations: list[dict[str, str]] = []
    for index in range(combo_count):
        combinations.append(
            {
                "name": f"combo-{index + 1:02d}",
                "dad": men[index % len(men)],
                "mom": women[index % len(women)],
                "kid": kids[index % len(kids)],
                "sibling": kids[(index + 5) % len(kids)],
                "friend": kids[(index + 10) % len(kids)],
            }
        )

    return combinations


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def merge_close_bands(bands: Iterable[Band], max_gap: int) -> list[Band]:
    merged: list[Band] = []
    for band in bands:
        if not merged:
            merged.append(band)
            continue

        previous = merged[-1]
        if band.start <= previous.end + max_gap + 1:
            merged[-1] = Band(previous.start, max(previous.end, band.end))
        else:
            merged.append(band)

    return merged


def is_white(pixel: tuple[int, int, int]) -> bool:
    return sum(pixel) >= 735


if __name__ == "__main__":
    raise SystemExit(main())
