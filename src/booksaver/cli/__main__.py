import sys

from booksaver.cli.commands import create_parser


def main() -> None:
    parser = create_parser()
    args = parser.parse_args()
    if not hasattr(args, "func"):
        parser.print_help()
        sys.exit(1)
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
