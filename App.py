import streamlit as st

from config import PAGE_TITLE
from data_loader import load_data, apply_sidebar_filters
from state_manager import init_profiles, add_profile, remove_profile
from ui_components import render_header, render_sliders, display_priority_results
from priority_logic import calculate_priority_df
from plots import render_exploration_section

st.set_page_config(layout="wide")

# ---------- Load data ----------
df = load_data()

# ---------- Header ----------
render_header()

# ---------- Init session state ----------
init_profiles()

# ---------- Sidebar filters ----------
filtered_df = apply_sidebar_filters(df)

# ---------- Weight profiles UI ----------
st.header('Adjust Feature Weights (Scale 0-5)')

col_add, col_remove, _ = st.columns([0.15, 0.15, 0.7])

if len(st.session_state.weight_profiles) < 5:
    col_add.button("➕ Add Profile", on_click=add_profile, use_container_width=True)

if len(st.session_state.weight_profiles) > 1:
    col_remove.button(
        "➖ Remove Last",
        on_click=remove_profile,
        args=(len(st.session_state.weight_profiles) - 1,),
        use_container_width=True
    )

tab_names = [p["name"] for p in st.session_state.weight_profiles]
tabs = st.tabs(tab_names)

for i, profile in enumerate(st.session_state.weight_profiles):
    with tabs[i]:
        render_sliders(i, st.container())
        st.markdown("---")
        p_df = calculate_priority_df(filtered_df, profile)
        display_priority_results(p_df, profile)

# ---------- Exploration ----------
render_exploration_section(df)
