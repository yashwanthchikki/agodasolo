import copy

PAGE_TITLE = "NetBenefits Page Prioritization"

BASE_CONFIG = {
    "pg_visitors": [3],
    "friction_calls_weight": [3],
    "aht_weight": [3],
    "desktop_switch_rate_weight": [3],
    "pg_visits": [3],
    "visits_per_visitor_weight": [3],
    "call_rate_weight": [3],
    "ease_of_use_weight": [3],
    "cei_top2box_weight": [3],
    "friction_desktop_7day_weight": [3]
}

CONFIGURATIONS = {
    "Balanced": copy.deepcopy(BASE_CONFIG),
    "Friction Focused": {
        **copy.deepcopy(BASE_CONFIG),
        "pg_visitors": [1],
        "friction_calls_weight": [5],
        "aht_weight": [4],
        "call_rate_weight": [5],
        "friction_desktop_7day_weight": [5],
    },
    "Engagement Heavy": {
        **copy.deepcopy(BASE_CONFIG),
        "pg_visitors": [4],
        "pg_visits": [5],
        "visits_per_visitor_weight": [4],
        "friction_calls_weight": [2],
        "aht_weight": [1],
        "call_rate_weight": [1],
    },
}

feature_groups = {
    "Volume & Engagement": {
        "pg_visitors": "VISITORS",
        "pg_visits": "VISITS",
        "visits_per_visitor_weight": "Visits_per_Visitor",
    },
    "Satisfaction & CX": {
        "cei_top2box_weight": "CEI_TOPBOX",
        "ease_of_use_weight": "EASE_OF_USE_TOPBOX",
    },
    "Calls ": {
        "friction_calls_weight": "CALLS_7_DAYS",
        "aht_weight": "AVG_AHT",
        "call_rate_weight": "Call_Rate",
    },
    "Desktop Switch ": {
        "desktop_switch_rate_weight": "Desktop_switch_rate",
        "friction_desktop_7day_weight": "SWITCH_TO_DESKTOP",
    },
}

DISPLAY_MAP = {
    "VISITORS": "Visitors",
    "VISITS": "Visits",
    "Visits_per_Visitor": "Visits/Visitor",
    "CALLS_7_DAYS": "Calls (7d)",
    "AVG_AHT": "Avg AHT",
    "Call_Rate": "Call Rate",
    "Desktop_switch_rate": "Desktop Switch %",
    "SWITCH_TO_DESKTOP": "Switches (7d)",
    "EASE_OF_USE_TOPBOX": "Ease of Use",
    "CEI_TOPBOX": "CEI",
}
