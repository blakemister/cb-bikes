from fastapi import APIRouter
from app.database import db

router = APIRouter()


@router.get("/api/schema")
async def get_schema():
    # Get all tables with row counts
    tables = await db.query(
        "SELECT t.name AS TableName, p.rows AS NumRows "
        "FROM sys.tables t "
        "JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1) "
        "ORDER BY t.name"
    )

    # Get columns for all tables
    columns = await db.query(
        "SELECT TABLE_NAME AS TableName, COLUMN_NAME AS ColName, DATA_TYPE AS DataType, "
        "CHARACTER_MAXIMUM_LENGTH AS MaxLen, IS_NULLABLE AS Nullable, "
        "ORDINAL_POSITION AS OrdPos "
        "FROM INFORMATION_SCHEMA.COLUMNS "
        "ORDER BY TABLE_NAME, ORDINAL_POSITION"
    )

    # Get primary keys
    pks = await db.query(
        "SELECT kcu.TABLE_NAME AS TableName, kcu.COLUMN_NAME AS ColName "
        "FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc "
        "JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu "
        "ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME "
        "WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'"
    )

    # Get foreign keys
    fks = await db.query(
        "SELECT "
        "OBJECT_NAME(fk.parent_object_id) AS FromTable, "
        "COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS FromCol, "
        "OBJECT_NAME(fk.referenced_object_id) AS ToTable, "
        "COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ToCol "
        "FROM sys.foreign_keys fk "
        "JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id"
    )

    # Build lookups
    pk_set: set[tuple[str, str]] = set()
    for pk in pks:
        pk_set.add((pk["table_name"], pk["col_name"]))

    fk_map: dict[tuple[str, str], dict] = {}
    for fk in fks:
        fk_map[(fk["from_table"], fk["from_col"])] = {
            "fk_table": fk["to_table"],
            "fk_column": fk["to_col"],
        }

    # Group columns by table
    col_by_table: dict[str, list[dict]] = {}
    for col in columns:
        tbl = col["table_name"]
        if tbl not in col_by_table:
            col_by_table[tbl] = []

        col_name = col["col_name"]
        type_str = col["data_type"]
        if col["max_len"]:
            type_str += f"({col['max_len']})"

        fk_info = fk_map.get((tbl, col_name))
        entry = {
            "column_name": col_name,
            "data_type": type_str,
            "nullable": col["nullable"] == "YES",
            "is_pk": (tbl, col_name) in pk_set,
            "is_fk": fk_info is not None,
        }
        if fk_info:
            entry["fk_table"] = fk_info["fk_table"]
            entry["fk_column"] = fk_info["fk_column"]
        col_by_table[tbl].append(entry)

    # Assemble final result
    result = []
    for t in tables:
        name = t["table_name"]
        result.append({
            "table_name": name,
            "row_count": t["num_rows"],
            "columns": col_by_table.get(name, []),
        })

    return result
