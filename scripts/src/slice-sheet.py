#!/usr/bin/env python3
from PIL import Image
from pathlib import Path
import argparse
import json

GRID_COLS = 4
GRID_ROWS = 4


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Slice a 4x4 storyboard sheet into 16 images.")
    parser.add_argument("input", nargs="?", default="storyboard.png", help="Input storyboard sheet image.")
    parser.add_argument("output_dir", nargs="?", default="sliced_pages", help="Directory for sliced pages.")
    parser.add_argument("--rows", type=int, default=GRID_ROWS, help=argparse.SUPPRESS)
    parser.add_argument("--cols", type=int, default=GRID_COLS, help=argparse.SUPPRESS)
    parser.add_argument("--inset", type=int, default=0, help=argparse.SUPPRESS)
    parser.add_argument("--prefix", type=str, default="page", help=argparse.SUPPRESS)
    parser.add_argument("--format", type=str, default="png", help=argparse.SUPPRESS)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_file = Path(args.input)
    output_dir = Path(args.output_dir)

    output_dir.mkdir(exist_ok=True)

    img = Image.open(input_file).convert("RGB")
    width, height = img.size

    if width != height:
        raise ValueError(f"Image must be square. Got {width}x{height}")

    if width % GRID_COLS != 0 or height % GRID_ROWS != 0:
        raise ValueError(f"Image size must divide cleanly by 4. Got {width}x{height}")

    panel_w = width // GRID_COLS
    panel_h = height // GRID_ROWS

    manifest: list[dict[str, object]] = []

    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            left = col * panel_w
            top = row * panel_h
            right = left + panel_w
            bottom = top + panel_h

            panel = img.crop((left, top, right, bottom))

            if row == 0 and col == 0:
                name = "01_cover.png"
            elif row == 0 and col == 1:
                name = "02_belongs_to.png"
            elif row == 0 and col == 2:
                name = "03_the_end.png"
            elif row == 0 and col == 3:
                name = "04_blank.png"
            else:
                story_page = ((row - 1) * GRID_COLS + col + 1)
                name = f"story_page_{story_page:02d}.png"

            out_path = output_dir / name
            panel.save(out_path, quality=95)
            manifest.append(
                {
                    "pageNumber": len(manifest) + 1,
                    "row": row + 1,
                    "col": col + 1,
                    "output": out_path.as_uri(),
                    "crop": {
                        "left": left,
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                    },
                }
            )

    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Done. Saved 16 images to: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
