import shutil
import sys
from pathlib import Path

from booksaver.cli.commands import create_parser


def _cleanup_bytecode_cache() -> None:
    package_root = Path(__file__).resolve().parents[1]
    for cache_dir in package_root.rglob("__pycache__"):
        shutil.rmtree(cache_dir, ignore_errors=True)


def main() -> None:
    parser = create_parser()
    args = parser.parse_args()
    if not hasattr(args, "func"):
        parser.print_help()
        sys.exit(1)
    try:
        exit_code = args.func(args)
    finally:
        _cleanup_bytecode_cache()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
