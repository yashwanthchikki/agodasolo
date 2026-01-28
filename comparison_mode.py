"""
Comparison Mode Module
"""

import streamlit as st
import pandas as pd
from config import FEATURE_MAP_FOR_DISPLAY


def display_results_for_profile(priority_df, profile_name):
    """Display prioritization results for a profile."""
    feature_map = {
        'PG Visitors': 'PG Visitors',
        'PG Visits': 'PG Visits',
        'PG Visits per Visitor': 'Visits/Visitor',
        'PG Friction - # Calls within 7 days': 'Calls (7d)',
        'Avg. AHT per call': 'Avg AHT',
        'Call Rate': 'Call Rate',
        'Desktop Switch Rate': 'Desktop Switch %',
        'PG Friction - Switch to Desktop within 7 days': 'Switches (7d)',
        'Ease of Use - Top2Box': 'Ease of Use',
        'CEI - Top2Box': 'CEI'
    }
    
    output_cols = ['PAGE_GROUP'] + list(feature_map.keys()) + ['RawPriority']
    
    st.subheader(f'{profile_name} - Prioritization Results')
    st.dataframe(
        priority_df[output_cols].reset_index(drop=True),
        use_container_width=True
    )


def display_comparison_mode(all_profile_results):
    """
    Display all profile results together in comparison mode.
    Shows each profile's results one after another for easy comparison.
    """
    st.markdown("## Profile Comparison View")
    st.markdown("All profiles displayed together for easy comparison.")
    
    for profile_name, priority_df in all_profile_results.items():
        st.markdown("---")
        display_results_for_profile(priority_df, profile_name)


def compare_profiles_side_by_side(profile_results_dict):
    """FUTURE: Side-by-side profile comparison."""
    st.info("Side-by-side comparison - ready for implementation")
    pass


def highlight_rank_changes(profile_results_dict, threshold=5):
    """FUTURE: Highlight pages with significant rank changes."""
    st.info("Rank change highlighting - ready for implementation")
    pass


def generate_comparison_report(profile_results_dict):
    """FUTURE: Generate downloadable comparison report."""
    st.info("Comparison report - ready for implementation")
    pass
