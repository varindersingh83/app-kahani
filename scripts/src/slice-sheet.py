#!/usr/bin/env python3
"""Slice a grid-style generated sheet into individual page images.

Defaults match the common 3x4 layout used for 12-page book sheets.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Slice a sheet image into page tiles.")
    parser.add_argument("input", type=Path, help="Source sheet image.")
    parser.add_argument(
        "output_dir",
        type=Path,
        nargs="?",
        default=None,
        help="Output directory for slices. Defaults to <input-stem>-slices next to the source file.",
    )
    parser.add_argument("--rows", type=int, default=4, help="Number of rows in the sheet.")
    parser.add_argument("--cols", type=int, default=3, help="Number of columns in the sheet.")
    parser.add_argument(
        "--inset",
        type=int,
        default=12,
        help="Pixels to trim from each tile edge to avoid the white gutter lines.",
    )
    parser.add_argument(
        "--prefix",
        type=str,
        default="page",
        help="Output filename prefix for slices.",
    )
    parser.add_argument(
        "--format",
        type=str,
        default="png",
        help="Output image format extension, like png or jpg.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.rows <= 0 or args.cols <= 0:
        raise SystemExit("--rows and --cols must be positive integers")
    if args.inset < 0:
        raise SystemExit("--inset must be zero or positive")
    if not args.input.exists():
        raise SystemExit(f"Input file not found: {args.input}")

    output_dir = args.output_dir or args.input.with_name(f"{args.input.stem}-slices")
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(args.input) as source:
        width, height = source.size
        cell_w = width / args.cols
        cell_h = height / args.rows
        manifest: list[dict[str, object]] = []

        for index in range(args.rows * args.cols):
            row = index // args.cols
            col = index % args.cols
            left = round(col * cell_w) + args.inset
            top = round(row * cell_h) + args.inset
            right = round((col + 1) * cell_w) - args.inset
            bottom = round((row + 1) * cell_h) - args.inset

            left = max(0, min(left, width - 1))
            top = max(0, min(top, height - 1))
            right = max(left + 1, min(right, width))
            bottom = max(top + 1, min(bottom, height))

            tile = source.crop((left, top, right, bottom))
            out_name = f"{args.prefix}-{index + 1:02d}.{args.format.lstrip('.')}"
            out_path = output_dir / out_name
            tile.save(out_path)
            manifest.append(
                {
                    "pageNumber": index + 1,
                    "row": row + 1,
                    "col": col + 1,
                    "source": str(args.input),
                    "output": str(out_path),
                    "crop": {
                        "left": left,
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                    },
                }
            )

    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Sliced {args.input} -> {output_dir}")
    print(f"Pages written: {len(manifest)}")
    print(f"Manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
