import streamlit as st
from PIL import Image
import copy

from config import CONFIGURATIONS, feature_groups, DISPLAY_MAP

def render_header():
    col_title, col_logo = st.columns([0.7, 0.3])

    col_title.markdown(
        "<h1 style='color:#4CAF50;margin-bottom:0'>NetBenefits Page Prioritization</h1>",
        unsafe_allow_html=True,
    )
    col_title.markdown("App Page Prioritization Engine", unsafe_allow_html=True)

    try:
        img = Image.open("logo.png").resize((500, 100))
        col_logo.image(img, use_container_width=True)
    except Exception:
        pass

    st.markdown("<hr style='border:4px solid #4CAF50'>", unsafe_allow_html=True)

def render_sliders(profile_index, container):
    profile = st.session_state.weight_profiles[profile_index]
    key_prefix = f"s_{profile_index}"

    def on_change(k):
        profile[k] = [st.session_state[f"{key_prefix}_{k}"]]

    col_name, col_preset = container.columns([0.6, 0.4])
    profile["name"] = col_name.text_input("Profile Name", profile["name"])

    presets = list(CONFIGURATIONS.keys())
    selected = col_preset.selectbox("Apply Preset", presets)

    if st.session_state.get(f"last_{profile_index}") != selected:
        st.session_state[f"last_{profile_index}"] = selected
        for k, v in copy.deepcopy(CONFIGURATIONS[selected]).items():
            profile[k] = v
        st.rerun()

    cols = container.columns(4)
    groups = list(feature_groups.keys())

    mapping = {
        cols[0]: [groups[0]],
        cols[1]: [groups[2]],
        cols[2]: [groups[1]],
        cols[3]: [groups[3]],
    }

    for col, gnames in mapping.items():
        with col:
            for g in gnames:
                st.markdown(f"**{g}**")
                with st.container(border=True):
                    for k, label in feature_groups[g].items():
                        st.slider(
                            label,
                            0,
                            5,
                            profile[k][0],
                            key=f"{key_prefix}_{k}",
                            on_change=on_change,
                            args=(k,),
                        )

def display_priority_results(df, profile):
    cols = ["PAGE_GROUP"] + list(DISPLAY_MAP.keys()) + ["RawPriority"]
    st.subheader(f'{profile["name"]} - Prioritization Results')
    st.dataframe(df[cols].reset_index(drop=True), use_container_width=True)
