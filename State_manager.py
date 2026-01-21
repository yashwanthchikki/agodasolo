import streamlit as st
from config import CONFIGURATIONS

def init_profiles():
    if "weight_profiles" not in st.session_state:
        st.session_state.weight_profiles = []

    if not st.session_state.weight_profiles:
        st.session_state.weight_profiles.append({
            "name": "Profile 1 (Balanced)",
            **CONFIGURATIONS["Balanced"]
        })

def add_profile():
    idx = len(st.session_state.weight_profiles) + 1
    st.session_state.weight_profiles.append({
        "name": f"Profile {idx} (Balanced)",
        **CONFIGURATIONS["Balanced"]
    })

def remove_profile(index):
    if len(st.session_state.weight_profiles) > 1:
        st.session_state.weight_profiles.pop(index)
