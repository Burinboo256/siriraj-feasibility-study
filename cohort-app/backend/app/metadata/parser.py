import re
import pathlib


def parse_data_dictionary(path: pathlib.Path) -> dict:
    text = path.read_text(encoding="utf-8")

    # Table index
    index_rows = []
    in_index = False
    for line in text.splitlines():
        if "## Table Index" in line:
            in_index = True
            continue
        if in_index:
            if line.startswith("##"):
                break
            if line.startswith("|") and not re.match(r"\|[-| ]+\|", line):
                cells = [c.strip() for c in line.strip("|").split("|")]
                if cells[0] != "#" and len(cells) >= 4:
                    index_rows.append({
                        "number": cells[0],
                        "original_name": cells[1],
                        "table_name": cells[2].strip("`"),
                        "domain": cells[3],
                    })

    # Per-table sections (split on hr lines)
    table_blocks = re.split(r"\n---\n", text)
    tables = {}

    for block in table_blocks:
        m = re.search(
            r"## \d+\. `(\w+)`[^\n]*\n\n"
            r"\*\*EN:\*\* (.*?)\n"
            r"\*\*TH:\*\* (.*?)\n"
            r"\nSource: `(.*?)`",
            block,
        )
        if not m:
            continue
        name, en, th, source = m.group(1), m.group(2), m.group(3), m.group(4)

        fields = []
        in_table = False
        for line in block.splitlines():
            if line.startswith("|"):
                cells = [c.strip() for c in line.strip("|").split("|")]
                if not cells:
                    continue
                # Detect separator row: cells made of dashes/colons
                if re.match(r"^[-:]+$", cells[0].strip("`")):
                    in_table = True
                    continue
                if in_table and len(cells) >= 6:
                    fields.append({
                        "original": cells[0].strip("`"),
                        "name": cells[1].strip("`"),
                        "en_desc": cells[2],
                        "th_desc": cells[3],
                        "type": cells[4],
                        "key": cells[5],
                    })
            elif in_table and not line.startswith("|"):
                in_table = False

        tables[name] = {"name": name, "en": en, "th": th, "source": source, "fields": fields}

    return {"tables": tables, "index": index_rows}
