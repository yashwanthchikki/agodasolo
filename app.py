"""
NetBenefits Page Prioritization Application
"""

import pandas as pd
import streamlit as st

from config import CONFIGURATIONS
from data_handler import load_data, apply_all_filters
from calculations import calculate_priority_df
from state_management import initialize_profiles, add_profile, remove_profile
from ui_components import render_header, render_sliders
from comparison_mode import display_results_for_profile, display_comparison_mode
from visualization import render_exploration_section

st.set_page_config(layout="wide")

# Load data
df = load_data('data.xlsx')

# Render header
render_header()

# Initialize profiles
initialize_profiles()

# Apply filters
filtered_df = apply_all_filters(df, st.sidebar)

# Weight adjustment UI
st.header('Adjust Feature Weights (Scale 1-5)')

col_add, col_remove, col_compare = st.columns([0.15, 0.15, 0.7])

col_add.button(
    "➕ Add Profile",
    on_click=add_profile,
    use_container_width=True
)

col_remove.button(
    "➖ Remove Last Profile",
    on_click=remove_profile,
    args=(len(st.session_state.weight_profiles) - 1,),
    use_container_width=True
)

# Comparison mode toggle
if 'comparison_mode' not in st.session_state:
    st.session_state.comparison_mode = False

comparison_toggle = col_compare.toggle(
    "Enable Comparison Mode",
    value=st.session_state.comparison_mode,
    key='comparison_mode_toggle',
    help="Show all profiles together for easy comparison"
)
st.session_state.comparison_mode = comparison_toggle

st.markdown("<br>", unsafe_allow_html=True)

# Check if comparison mode is enabled
if st.session_state.comparison_mode:
    # Comparison mode: Calculate all profiles and display together
    st.markdown("---")
    
    all_results = {}
    for profile in st.session_state.weight_profiles:
        priority_df = calculate_priority_df(filtered_df, profile)
        all_results[profile['name']] = priority_df
    
    display_comparison_mode(all_results)
    
else:
    # Normal mode: Tabs for each profile
    tab_names = [p['name'] for p in st.session_state.weight_profiles]
    tabs = st.tabs(tab_names)

    for i, profile in enumerate(st.session_state.weight_profiles):
        with tabs[i]:
            slider_container = st.container()
            with slider_container:
                render_sliders(i, slider_container)
            
            st.markdown("---")
            
            priority_df = calculate_priority_df(filtered_df, profile)
            display_results_for_profile(priority_df, profile['name'])

# Visualization section
st.markdown("---")
st.markdown("## Visualization Section")
st.markdown("This area can be used for additional analysis.")

# Exploration
render_exploration_section(df)

st.markdown("---")
