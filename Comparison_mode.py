# Simple comparison logic between two priority outputs

def compare_two_profiles(df_a, df_b, key="PAGE_GROUP"):
    """
    Compares RawPriority scores between two profiles.
    Returns delta (A - B) sorted by impact.
    """

    merged = df_a[[key, "RawPriority"]].merge(
        df_b[[key, "RawPriority"]],
        on=key,
        suffixes=("_A", "_B"),
    )

    merged["Delta"] = merged["RawPriority_A"] - merged["RawPriority_B"]

    return merged.sort_values("Delta", ascending=False)
