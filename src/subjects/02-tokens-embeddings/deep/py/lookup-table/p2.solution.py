def table_bytes(vocab, d, bytes_per_number):
    """Memory for an embedding table: vocab × d numbers, each bytes_per_number bytes (4 = float32, 2 = float16)."""
    return vocab * d * bytes_per_number

def matmul_vs_lookup(vocab, d):
    """Multiply-adds for one token done as one-hot × table, divided by numbers read by a direct lookup."""
    return (vocab * d) / d

print(table_bytes(30522, 384, 4) / 1e6, "MB for MiniLM's table in float32")
print(matmul_vs_lookup(30522, 384), "times more work for the matrix product")
