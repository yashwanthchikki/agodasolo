import pandas as pd
from config import BASE_CONFIG

def normalize(series):
    if series.empty or series.max() == series.min():
        return pd.Series(0.0, index=series.index)
    return (series - series.min()) / (series.max() - series.min())

def normalize_weights(weights):
    keys = BASE_CONFIG.keys()
    vals = [weights[k][0] for k in keys]
    mn, mx = min(vals), max(vals)

    if mn == mx:
        return {k: 1.0 for k in keys}

    return {k: (weights[k][0] - mn) / (mx - mn) for k in keys}

def calculate_priority_df(df, profile):
    w = df.copy()

    w["n_visitors"] = normalize(w["VISITORS"])
    w["n_visits"] = normalize(w["VISITS"])
    w["n_vpv"] = normalize(w["Visits_per_Visitor"])
    w["n_calls"] = normalize(w["CALLS_7_DAYS"])
    w["n_aht"] = normalize(w["AVG_AHT"])
    w["n_dsr"] = normalize(w["Desktop_switch_rate"])
    w["n_sw_desk"] = normalize(w["SWITCH_TO_DESKTOP"])
    w["n_call_rate"] = normalize(w["Call_Rate"])
    w["n_cei"] = normalize(100 - w["CEI_TOPBOX"])
    w["n_eou"] = normalize(100 - w["EASE_OF_USE_TOPBOX"])

    nw = normalize_weights(profile)

    w["RawPriority"] = (
        w["n_visitors"] * nw["pg_visitors"] +
        w["n_visits"] * nw["pg_visits"] +
        w["n_vpv"] * nw["visits_per_visitor_weight"] +
        w["n_calls"] * nw["friction_calls_weight"] +
        w["n_aht"] * nw["aht_weight"] +
        w["n_call_rate"] * nw["call_rate_weight"] +
        w["n_dsr"] * nw["desktop_switch_rate_weight"] +
        w["n_sw_desk"] * nw["friction_desktop_7day_weight"] +
        w["n_eou"] * nw["ease_of_use_weight"] +
        w["n_cei"] * nw["cei_top2box_weight"]
    )

    return w.sort_values("RawPriority", ascending=False)
